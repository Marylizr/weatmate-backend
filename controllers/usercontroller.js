require("dotenv").config();

const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const mongoose = require("mongoose");

const { processMedicalFile } = require("../services/medicalProcessor");

const {
  safeObj,
  safeString,
  safeStringArray,
  allowedFitnessLevels,
  allowedActivityLevels,
  allowedRoles,
  allowedGender,
  normalizeSpecializations,
  sanitizeInjuryProfile,
  sanitizeAccessibilityProfile,
  buildHealthFlagsFromProfiles,
} = require("../services/userProfileSanitizer");

// ------------------------------------------------------
// ENERGY AVAILABILITY FLAGS
// ------------------------------------------------------
const computeEnergyFlags = (energyAvailability = {}) => {
  const score =
    (energyAvailability.recentWeightLoss ? 1 : 0) +
    (energyAvailability.restrictiveDieting ? 1 : 0) +
    (energyAvailability.fearOfWeightGain ? 1 : 0) +
    (energyAvailability.lowEnergy ? 1 : 0) +
    (energyAvailability.frequentIllness ? 1 : 0) +
    (energyAvailability.coldIntolerance ? 1 : 0) +
    (energyAvailability.hairLoss ? 1 : 0) +
    (energyAvailability.stressFractureHistory ? 2 : 0) +
    (energyAvailability.injuryFrequencyHigh ? 1 : 0) +
    (energyAvailability.missedPeriods3PlusMonths ? 2 : 0);

  const amenorrheaRisk =
    energyAvailability.missedPeriods3PlusMonths === true ||
    (typeof energyAvailability.cyclesPerYear === "number" &&
      energyAvailability.cyclesPerYear > 0 &&
      energyAvailability.cyclesPerYear < 9);

  const redSRisk = score >= 4 || amenorrheaRisk;
  const leaRisk = score >= 3;

  let rationale = `score=${score}`;

  if (amenorrheaRisk) {
    rationale += " + amenorrhea_indicators";
  }

  return {
    redS_risk: redSRisk,
    lea_risk: leaRisk,
    amenorrhea_risk: amenorrheaRisk,
    lastCalculatedAt: new Date(),
    rationale,
  };
};

// ------------------------------------------------------
// ACCESS CONTROL HELPER
// ------------------------------------------------------
const canTrainerAccessClient = async (trainerUserId, clientId) => {
  const client = await User.findById(clientId).select("trainerId role");

  if (!client) {
    return {
      ok: false,
      status: 404,
      message: "User not found.",
    };
  }

  if (client.role !== "basic") {
    return {
      ok: false,
      status: 403,
      message: "Access denied.",
    };
  }

  if (String(client.trainerId || "") !== String(trainerUserId)) {
    return {
      ok: false,
      status: 403,
      message: "Access denied.",
    };
  }

  return {
    ok: true,
    client,
  };
};

const canAccessTargetUser = async ({ req, targetUserId }) => {
  const authUserId = req.user?.id || req.user?._id;
  const authRole = req.user?.role;

  if (!authUserId) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
    };
  }

  if (authRole === "admin") {
    return {
      ok: true,
    };
  }

  if (String(authUserId) === String(targetUserId)) {
    return {
      ok: true,
    };
  }

  if (authRole === "personal-trainer") {
    return canTrainerAccessClient(authUserId, targetUserId);
  }

  return {
    ok: false,
    status: 403,
    message: "Access denied.",
  };
};

const buildSafeNutritionProfile = (nutritionProfile) => {
  const np = safeObj(nutritionProfile);

  return {
    dietType: typeof np.dietType === "string" ? np.dietType : "standard",
    intolerances: safeStringArray(np.intolerances),
    allergies: safeStringArray(np.allergies),
    dislikes: safeStringArray(np.dislikes),
  };
};

const buildSafeMedicalFlags = (medicalFlags) => {
  if (Array.isArray(medicalFlags)) {
    return medicalFlags.filter(Boolean);
  }

  if (medicalFlags && typeof medicalFlags === "object") {
    return Object.keys(medicalFlags).filter(
      (key) => medicalFlags[key] === true,
    );
  }

  return [];
};

// ------------------------------------------------------
// FEMALE PROFILE SANITIZER
// ------------------------------------------------------
const sanitizeFemaleProfile = (incoming = {}) => {
  const fp = safeObj(incoming);
  const out = {};

  if (typeof fp.lifeStage !== "undefined") {
    out.lifeStage = fp.lifeStage;
  }

  if (typeof fp.cycleTrackingEnabled !== "undefined") {
    out.cycleTrackingEnabled = !!fp.cycleTrackingEnabled;
  }

  if (typeof fp.cycle !== "undefined") {
    const c = safeObj(fp.cycle);
    out.cycle = {};

    const cycleKeys = [
      "avgCycleLengthDays",
      "avgBleedDays",
      "lastPeriodStartDate",
      "currentPhase",
      "estimatedOvulationDay",
      "estimatedOvulationDate",
      "isIrregular",
      "cyclesPerYear",
    ];

    cycleKeys.forEach((key) => {
      if (typeof c[key] !== "undefined") {
        out.cycle[key] = c[key];
      }
    });

    if (typeof c.symptoms !== "undefined") {
      const s = safeObj(c.symptoms);
      out.cycle.symptoms = {};

      const symptomKeys = [
        "cramps",
        "headache",
        "bloating",
        "breastTenderness",
        "moodChanges",
        "fatigue",
        "sleepIssues",
        "lowBackPain",
        "acne",
        "foodCravings",
      ];

      symptomKeys.forEach((key) => {
        if (typeof s[key] !== "undefined") {
          out.cycle.symptoms[key] = s[key];
        }
      });
    }
  }

  if (typeof fp.contraception !== "undefined") {
    const cc = safeObj(fp.contraception);
    out.contraception = {};

    const keys = ["usesHormonalContraception", "method", "startedAt", "notes"];

    keys.forEach((key) => {
      if (typeof cc[key] !== "undefined") {
        out.contraception[key] =
          key === "usesHormonalContraception" ? !!cc[key] : cc[key];
      }
    });
  }

  if (typeof fp.hormoneTherapy !== "undefined") {
    const ht = safeObj(fp.hormoneTherapy);
    out.hormoneTherapy = {};

    const keys = ["usesHRT", "type", "startedAt", "notes"];

    keys.forEach((key) => {
      if (typeof ht[key] !== "undefined") {
        out.hormoneTherapy[key] = key === "usesHRT" ? !!ht[key] : ht[key];
      }
    });
  }

  if (typeof fp.energyAvailability !== "undefined") {
    const ea = safeObj(fp.energyAvailability);
    out.energyAvailability = {};

    const keys = [
      "recentWeightLoss",
      "restrictiveDieting",
      "fearOfWeightGain",
      "lowEnergy",
      "frequentIllness",
      "coldIntolerance",
      "hairLoss",
      "stressFractureHistory",
      "injuryFrequencyHigh",
      "missedPeriods3PlusMonths",
      "cyclesPerYear",
      "notes",
    ];

    keys.forEach((key) => {
      if (typeof ea[key] !== "undefined") {
        out.energyAvailability[key] = ea[key];
      }
    });
  }

  if (typeof fp.clinicalFlags !== "undefined") {
    const flags = safeObj(fp.clinicalFlags);
    out.clinicalFlags = {};

    const keys = [
      "hasREDS",
      "hasLEA",
      "suspectedLEA",
      "hasAmenorrhea",
      "hasOligomenorrhea",
      "hasPCOS",
      "hasEndometriosis",
      "hasPMDD",
      "pelvicFloorConcerns",
      "vasomotorSymptoms",
    ];

    keys.forEach((key) => {
      if (typeof flags[key] !== "undefined") {
        out.clinicalFlags[key] = !!flags[key];
      }
    });
  }

  if (typeof fp.trainingConsiderations !== "undefined") {
    const training = safeObj(fp.trainingConsiderations);
    out.trainingConsiderations = {};

    const keys = [
      "preferredIntensityOnLuteal",
      "painLimitationsNotes",
      "fatigueNotes",
    ];

    keys.forEach((key) => {
      if (typeof training[key] !== "undefined") {
        out.trainingConsiderations[key] = training[key];
      }
    });
  }

  out.updatedAt = new Date();

  return out;
};

const mergeFemaleProfile = (prev = {}, patch = {}) => {
  const p = prev?.toObject?.() || prev || {};

  return {
    ...p,
    ...patch,
    cycle: {
      ...(p.cycle || {}),
      ...(patch.cycle || {}),
      symptoms: {
        ...(p.cycle?.symptoms || {}),
        ...(patch.cycle?.symptoms || {}),
      },
    },
    contraception: {
      ...(p.contraception || {}),
      ...(patch.contraception || {}),
    },
    hormoneTherapy: {
      ...(p.hormoneTherapy || {}),
      ...(patch.hormoneTherapy || {}),
    },
    clinicalFlags: {
      ...(p.clinicalFlags || {}),
      ...(patch.clinicalFlags || {}),
    },
    energyAvailability: {
      ...(p.energyAvailability || {}),
      ...(patch.energyAvailability || {}),
      flags: {
        ...(p.energyAvailability?.flags || {}),
        ...(patch.energyAvailability?.flags || {}),
      },
    },
    trainingConsiderations: {
      ...(p.trainingConsiderations || {}),
      ...(patch.trainingConsiderations || {}),
    },
  };
};

// ------------------------------------------------------
// AUTH TOKEN HELPER
// ------------------------------------------------------
exports.generateToken = (userId, role, gender) => {
  return jwt.sign({ id: userId, role, gender }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// ------------------------------------------------------
// BASIC USER READS
// ------------------------------------------------------
exports.findOne = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid user session" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      gender: user.gender,

      fitness_level: user.fitness_level,
      activityLevel: user.activityLevel,

      goal: user.goal,
      age: user.age,
      weight: user.weight,
      height: user.height,

      degree: user.degree,
      experience: user.experience,
      specializations: user.specializations || [],
      bio: user.bio,
      location: user.location,

      trainerId: user.trainerId,

      nutritionProfile: user.nutritionProfile || null,
      medicalFlags: user.medicalFlags || [],
      medicalHistory: user.medicalHistory || [],
      injuryProfile: user.injuryProfile || null,
      accessibilityProfile: user.accessibilityProfile || null,

      preferences: user.preferences || [],
      sessionNotes: user.sessionNotes || [],

      femaleProfile: user.femaleProfile || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const authRole = req.user?.role;
    const authUserId = req.user?.id || req.user?._id;

    let query = {};

    if (authRole === "personal-trainer") {
      query = {
        $or: [{ trainerId: authUserId }, { _id: authUserId }],
      };
    }

    const users = await User.find(query).select("-password");

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({
      message: "Unable to retrieve users",
      error: err.message,
    });
  }
};

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: "personal-trainer" }).select(
      "name email _id image specializations location",
    );

    return res.status(200).json(trainers);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve trainers",
      error: error.message,
    });
  }
};

exports.findOneName = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id).select("name");

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(userData.name);
  } catch (err) {
    return res.status(500).json({
      message: "Unable to retrieve user name",
      error: err.message,
    });
  }
};

exports.findOneEmail = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id).select("email");

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(userData.email);
  } catch (err) {
    return res.status(500).json({
      message: "Unable to retrieve user email",
      error: err.message,
    });
  }
};

exports.findOneId = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "me") {
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized." });
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      ...user.toObject(),
      femaleProfile: user.femaleProfile || null,
    });
  } catch (err) {
    console.error("Error retrieving user:", err.message);

    return res.status(500).json({
      message: "Unable to retrieve user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// OAUTH / EMAIL VERIFICATION
// ------------------------------------------------------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

exports.oauth2callback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not provided.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      process.env.OAUTH_REFRESH_TOKEN = tokens.refresh_token;
    } else {
      console.warn(
        'No refresh token received. Ensure "prompt=consent" is used in authUrl.',
      );
    }

    return res.status(200).send("Authorization successful! Tokens acquired.");
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.message);

    return res.status(500).send("Failed to exchange code for tokens.");
  }
};

async function createTransporter() {
  if (!process.env.OAUTH_REFRESH_TOKEN) {
    throw new Error(
      "Refresh token is missing. Reauthorize the app to obtain it.",
    );
  }

  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  });

  const { token: accessToken } = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_EMAIL_USER,
      pass: process.env.GOOGLE_EMAIL_PASSWORD,
      accessToken,
    },
  });
}

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token is required.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification link expired. Please request a new one.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.GOOGLE_EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `,
    };

    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Verification email sent.",
    });
  } catch (error) {
    console.error("Error sending verification email:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// CREATE USER BY ADMIN
// ------------------------------------------------------
exports.createUserByAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized: Only admins can create users.",
      });
    }

    const {
      name,
      email,
      password,
      age,
      weight,
      height,
      goal,
      role,
      gender,
      degree,
      experience,
      specializations,
      bio,
      location,
      trainerId,
      fitness_level,
      activityLevel,
      nutritionProfile,
      medicalFlags,
      injuryProfile,
      accessibilityProfile,
      preferences,
      sessionNotes,
    } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.trim().length < 8
    ) {
      return res.status(400).json({
        message: "Password is required and must be at least 8 characters long.",
      });
    }

    const assignedRole = allowedRoles.includes(role) ? role : "basic";

    const safeGender = allowedGender.includes(gender) ? gender : "female";

    const safeFitnessLevel = allowedFitnessLevels.includes(fitness_level)
      ? fitness_level
      : "beginner";

    const safeActivityLevel = allowedActivityLevels.includes(activityLevel)
      ? activityLevel
      : "light";

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    let safeTrainerId = undefined;

    if (assignedRole === "basic" && trainerId) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer ID format." });
      }

      const trainer = await User.findOne({
        _id: trainerId,
        role: "personal-trainer",
      });

      if (!trainer) {
        return res.status(400).json({
          message:
            "Selected trainer does not exist or is not a personal trainer.",
        });
      }

      safeTrainerId = trainerId;
    }

    if (assignedRole === "admin" || assignedRole === "personal-trainer") {
      safeTrainerId = undefined;
    }

    const safeNutritionProfile = nutritionProfile
      ? buildSafeNutritionProfile(nutritionProfile)
      : undefined;

    const safeInjuryProfile = injuryProfile
      ? sanitizeInjuryProfile(injuryProfile)
      : undefined;

    const safeAccessibilityProfile = accessibilityProfile
      ? sanitizeAccessibilityProfile(accessibilityProfile)
      : undefined;

    const safeMedicalFlags = buildHealthFlagsFromProfiles({
      medicalFlags: safeStringArray(medicalFlags),
      injuryProfile: safeInjuryProfile,
      accessibilityProfile: safeAccessibilityProfile,
    });

    const passwordHashed = await bcrypt.hash(password.trim(), 10);

    const isVerified =
      assignedRole === "admin" || assignedRole === "personal-trainer";

    const newUserData = {
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHashed,

      age: age !== undefined ? Number(age) || undefined : undefined,
      weight: weight !== undefined ? Number(weight) || undefined : undefined,
      height: height !== undefined ? Number(height) || undefined : undefined,
      goal: goal || undefined,
      gender: safeGender,

      role: assignedRole,
      trainerId: safeTrainerId,

      fitness_level: safeFitnessLevel,
      activityLevel: safeActivityLevel,

      nutritionProfile: safeNutritionProfile,
      medicalFlags: safeMedicalFlags,
      injuryProfile: safeInjuryProfile,
      accessibilityProfile: safeAccessibilityProfile,

      preferences: Array.isArray(preferences) ? preferences : undefined,
      sessionNotes: Array.isArray(sessionNotes) ? sessionNotes : undefined,

      degree: safeString(degree),
      experience: experience !== undefined ? Number(experience) || 0 : 0,
      specializations: normalizeSpecializations(specializations),
      bio: safeString(bio),
      location: safeString(location),

      isVerified,
    };

    const newUser = new User(newUserData);
    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        gender: newUser.gender,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    return res.status(201).json({
      token,
      id: newUser._id,
      _id: newUser._id,
      role: newUser.role,
      gender: newUser.gender,
      name: newUser.name,
      email: newUser.email,
      fitness_level: newUser.fitness_level,
      activityLevel: newUser.activityLevel,
      trainerId: newUser.trainerId || null,
      specializations: newUser.specializations || [],
      message: isVerified
        ? "Admin or Personal Trainer account created successfully."
        : "Account created successfully. Please verify your email to activate your account.",
    });
  } catch (err) {
    console.error("Error creating user by admin:", err);

    return res.status(500).json({
      message: "Unable to create user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// CREATE USER PUBLIC OR TRAINER-CREATED CLIENT
// ------------------------------------------------------
exports.create = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      weight,
      height,
      goal,
      gender,
      fitness_level,
      role,
      trainerId,
      activityLevel,
    } = req.body || {};

    const authRole = req.user?.role || null;
    const authUserId = req.user?.id || req.user?._id || null;

    const isAdmin = authRole === "admin";
    const isTrainer = authRole === "personal-trainer";

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.trim().length < 8
    ) {
      return res.status(400).json({
        message: "Password is required and must be at least 8 characters long.",
      });
    }

    const safeGender = allowedGender.includes(gender) ? gender : "female";

    const safeFitnessLevel = allowedFitnessLevels.includes(fitness_level)
      ? fitness_level
      : "beginner";

    const safeActivityLevel = allowedActivityLevels.includes(activityLevel)
      ? activityLevel
      : "light";

    let assignedRole = "basic";

    if (isAdmin) {
      assignedRole = allowedRoles.includes(role) ? role : "basic";
    }

    if (isTrainer) {
      assignedRole = "basic";
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHashed = await bcrypt.hash(password.trim(), 10);

    const newUserData = {
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHashed,

      age: age !== undefined ? Number(age) || undefined : undefined,
      weight: weight !== undefined ? Number(weight) || undefined : undefined,
      height: height !== undefined ? Number(height) || undefined : undefined,
      goal: goal || undefined,
      gender: safeGender,

      role: assignedRole,
      fitness_level: safeFitnessLevel,
      activityLevel: safeActivityLevel,

      isVerified: false,
    };

    if (isAdmin && assignedRole === "basic" && trainerId) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainerId." });
      }

      const trainerExists = await User.findOne({
        _id: trainerId,
        role: "personal-trainer",
      });

      if (!trainerExists) {
        return res.status(400).json({
          message:
            "Selected trainer does not exist or is not a personal trainer.",
        });
      }

      newUserData.trainerId = trainerId;
    }

    if (isTrainer && assignedRole === "basic") {
      newUserData.trainerId = authUserId;
    }

    if (assignedRole === "personal-trainer" || assignedRole === "admin") {
      delete newUserData.trainerId;
    }

    const newUser = new User(newUserData);
    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        gender: newUser.gender,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    return res.status(201).json({
      token,
      id: newUser._id,
      _id: newUser._id,
      role: newUser.role,
      gender: newUser.gender,
      name: newUser.name,
      email: newUser.email,
      fitness_level: newUser.fitness_level,
      activityLevel: newUser.activityLevel,
      trainerId: newUser.trainerId || null,
      message:
        "Account created successfully. Please verify your email to activate your account.",
    });
  } catch (err) {
    console.error("Error creating user:", err);

    return res.status(500).json({
      message: "Unable to create user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// DELETE USER
// ------------------------------------------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    await User.deleteOne({ _id: id });

    return res.status(200).json({
      message: "User was deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to delete user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// UPDATE USER PROFILE
// ------------------------------------------------------
exports.update = async (req, res) => {
  try {
    const paramId = req.params?.id;
    const authUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin";

    let targetUserId = null;

    if (paramId && paramId !== "me") {
      targetUserId = String(paramId);
    } else {
      if (!authUserId) {
        return res.status(401).json({ message: "Unauthorized." });
      }

      targetUserId = String(authUserId);
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const body = { ...req.body };
    const updateData = {};
    const unsetData = {};

    if (!isAdmin) {
      delete body.trainerId;
      delete body.role;
      delete body.isVerified;
    }

    if (typeof body.name === "string") {
      updateData.name = body.name.trim();
    }

    if (typeof body.email === "string") {
      updateData.email = body.email.trim().toLowerCase();
    }

    if (body.height !== undefined) {
      updateData.height = Number(body.height) || 0;
    }

    if (body.weight !== undefined) {
      updateData.weight = Number(body.weight) || 0;
    }

    if (typeof body.goal === "string") {
      updateData.goal = body.goal;
    }

    if (body.gender !== undefined) {
      if (!allowedGender.includes(body.gender)) {
        return res.status(400).json({
          message: "Invalid gender. Allowed values: female, male.",
        });
      }

      updateData.gender = body.gender;
    }

    if (body.birthDate) {
      updateData.birthDate = body.birthDate;
    }

    if (body.age !== undefined) {
      updateData.age = Number(body.age) || 0;
    }

    if (typeof body.image === "string") {
      updateData.image = body.image;
    }

    if (body.fitness_level !== undefined) {
      if (!allowedFitnessLevels.includes(body.fitness_level)) {
        return res.status(400).json({
          message:
            "Invalid fitness_level. Allowed values: beginner, intermediate, advanced.",
        });
      }

      updateData.fitness_level = body.fitness_level;
    }

    if (body.activityLevel !== undefined) {
      if (!allowedActivityLevels.includes(body.activityLevel)) {
        return res.status(400).json({
          message:
            "Invalid activityLevel. Allowed values: sedentary, light, moderate, very_active, athlete.",
        });
      }

      updateData.activityLevel = body.activityLevel;
    }

    if (isAdmin && body.role !== undefined) {
      if (!allowedRoles.includes(body.role)) {
        return res.status(400).json({
          message:
            "Invalid role. Allowed values: basic, personal-trainer, admin.",
        });
      }

      updateData.role = body.role;
    }

    if (isAdmin && body.trainerId !== undefined) {
      if (!body.trainerId) {
        unsetData.trainerId = "";
      } else {
        if (!mongoose.Types.ObjectId.isValid(body.trainerId)) {
          return res.status(400).json({ message: "Invalid trainerId." });
        }

        const trainerExists = await User.findOne({
          _id: body.trainerId,
          role: "personal-trainer",
        });

        if (!trainerExists) {
          return res.status(400).json({
            message:
              "Selected trainer does not exist or is not a personal trainer.",
          });
        }

        updateData.trainerId = body.trainerId;
      }
    }

    if (
      isAdmin &&
      (body.role === "personal-trainer" || body.role === "admin")
    ) {
      unsetData.trainerId = "";
    }

    if (body.password !== undefined) {
      const raw = body.password?.trim();

      if (raw) {
        if (raw.length < 8) {
          return res.status(400).json({
            message: "Password must be at least 8 characters long.",
          });
        }

        updateData.password = await bcrypt.hash(raw, 10);
      }
    }

    if (body.nutritionProfile !== undefined) {
      updateData.nutritionProfile = buildSafeNutritionProfile(
        body.nutritionProfile,
      );
    }

    if (body.medicalFlags !== undefined) {
      updateData.medicalFlags = buildSafeMedicalFlags(body.medicalFlags);
    }

    if (body.injuryProfile !== undefined) {
      updateData.injuryProfile = sanitizeInjuryProfile(body.injuryProfile);
    }

    if (body.accessibilityProfile !== undefined) {
      updateData.accessibilityProfile = sanitizeAccessibilityProfile(
        body.accessibilityProfile,
      );
    }

    if (
      body.injuryProfile !== undefined ||
      body.accessibilityProfile !== undefined
    ) {
      const existingUser = await User.findById(targetUserId).select(
        "medicalFlags injuryProfile accessibilityProfile",
      );

      updateData.medicalFlags = buildHealthFlagsFromProfiles({
        medicalFlags:
          updateData.medicalFlags !== undefined
            ? updateData.medicalFlags
            : existingUser?.medicalFlags || [],
        injuryProfile:
          updateData.injuryProfile !== undefined
            ? updateData.injuryProfile
            : existingUser?.injuryProfile,
        accessibilityProfile:
          updateData.accessibilityProfile !== undefined
            ? updateData.accessibilityProfile
            : existingUser?.accessibilityProfile,
      });
    }

    if (body.specializations !== undefined) {
      updateData.specializations = normalizeSpecializations(
        body.specializations,
      );
    }

    if (typeof body.degree === "string") {
      updateData.degree = body.degree.trim();
    }

    if (body.experience !== undefined) {
      updateData.experience = Number(body.experience) || 0;
    }

    if (typeof body.bio === "string") {
      updateData.bio = body.bio.trim();
    }

    if (typeof body.location === "string") {
      updateData.location = body.location.trim();
    }

    if (isAdmin && typeof body.isVerified === "boolean") {
      updateData.isVerified = body.isVerified;
    }

    if (
      Object.keys(updateData).length === 0 &&
      Object.keys(unsetData).length === 0
    ) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const updatePayload = {};

    if (Object.keys(updateData).length > 0) {
      updatePayload.$set = updateData;
    }

    if (Object.keys(unsetData).length > 0) {
      updatePayload.$unset = unsetData;
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updatePayload,
      {
        new: true,
        runValidators: true,
        context: "query",
        select: "-password",
      },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: "Email already in use." });
    }

    console.error("Update user error:", err);

    return res.status(500).json({
      message: "Unable to update user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// FEMALE PROFILE ENDPOINTS
// ------------------------------------------------------
exports.updateMyFemaleProfile = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;

    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const incoming = req.body?.femaleProfile;

    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ message: "femaleProfile is required." });
    }

    const patch = sanitizeFemaleProfile(incoming);

    if (patch.energyAvailability) {
      patch.energyAvailability.flags = computeEnergyFlags(
        patch.energyAvailability,
      );
      patch.energyAvailability.lastUpdatedAt = new Date();
    }

    const user = await User.findById(authUserId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.femaleProfile = mergeFemaleProfile(user.femaleProfile, patch);
    await user.save();

    return res.status(200).json({
      femaleProfile: user.femaleProfile,
    });
  } catch (err) {
    console.error("updateMyFemaleProfile error:", err);

    return res.status(500).json({
      message: "Unable to update female profile",
      error: err.message,
    });
  }
};

exports.updateClientFemaleProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const isAdmin = req.user?.role === "admin";
    const isTrainer = req.user?.role === "personal-trainer";

    if (!isAdmin && !isTrainer) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!isAdmin) {
      const trainerId = req.user?.id || req.user?._id;
      const access = await canTrainerAccessClient(trainerId, id);

      if (!access.ok) {
        return res.status(access.status).json({ message: access.message });
      }
    }

    const incoming = req.body?.femaleProfile;

    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ message: "femaleProfile is required." });
    }

    const patch = sanitizeFemaleProfile(incoming);

    if (patch.energyAvailability) {
      patch.energyAvailability.flags = computeEnergyFlags(
        patch.energyAvailability,
      );
      patch.energyAvailability.lastUpdatedAt = new Date();
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.femaleProfile = mergeFemaleProfile(user.femaleProfile, patch);
    await user.save();

    return res.status(200).json({
      message: "femaleProfile updated successfully",
      femaleProfile: user.femaleProfile,
    });
  } catch (err) {
    console.error("updateClientFemaleProfile error:", err);

    return res.status(500).json({
      message: "Unable to update femaleProfile",
      error: err.message,
    });
  }
};

exports.getClientSnapshot = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const isAdmin = req.user?.role === "admin";
    const isTrainer = req.user?.role === "personal-trainer";

    if (!isAdmin && !isTrainer) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!isAdmin) {
      const trainerId = req.user?.id || req.user?._id;
      const access = await canTrainerAccessClient(trainerId, id);

      if (!access.ok) {
        return res.status(access.status).json({ message: access.message });
      }
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      gender: user.gender,

      fitness_level: user.fitness_level,
      activityLevel: user.activityLevel,

      goal: user.goal,
      age: user.age,
      weight: user.weight,
      height: user.height,

      trainerId: user.trainerId,

      nutritionProfile: user.nutritionProfile || null,
      medicalFlags: user.medicalFlags || [],
      medicalHistory: user.medicalHistory || [],
      injuryProfile: user.injuryProfile || null,
      accessibilityProfile: user.accessibilityProfile || null,

      femaleProfile: user.femaleProfile || null,
    });
  } catch (err) {
    console.error("getClientSnapshot error:", err);

    return res.status(500).json({
      message: "Unable to retrieve client snapshot",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// SESSION NOTES
// ------------------------------------------------------
exports.addSessionNote = async (req, res) => {
  const { note, date } = req.body;

  if (!note || !date) {
    return res.status(400).json({
      message: "Note and date are required.",
    });
  }

  try {
    const access = await canAccessTargetUser({
      req,
      targetUserId: req.params.id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.sessionNotes.push({ note, date });
    await user.save();

    return res.status(201).json({
      message: "Session note added successfully.",
      sessionNotes: user.sessionNotes,
    });
  } catch (error) {
    console.error("Error adding session note:", error);

    return res.status(500).json({
      message: "Error adding session note.",
      error: error.message,
    });
  }
};

exports.getSessionNotes = async (req, res) => {
  const { id } = req.params;

  try {
    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id).select("sessionNotes");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user.sessionNotes || []);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching session notes.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// MEDICAL HISTORY
// ------------------------------------------------------
exports.addMedicalHistory = async (req, res) => {
  try {
    const { history, date } = req.body;
    const file = req.file;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: req.params.id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let analysis = null;
    let pdfUrl = "";

    if (file) {
      analysis = await processMedicalFile(file);
      pdfUrl = file.path;
    }

    const safeAnalysis = analysis
      ? {
          summary: analysis.summary || "",
          conditions: Array.isArray(analysis.conditions)
            ? analysis.conditions.map((condition) => ({
                name: condition.name || "",
                value: condition.value || "",
                normalRange: condition.normalRange || "",
                severity: ["normal", "low", "moderate", "high"].includes(
                  condition.severity,
                )
                  ? condition.severity
                  : "",
                recommendation: condition.recommendation || "",
              }))
            : [],
          flags: Array.isArray(analysis.flags) ? analysis.flags : [],
        }
      : null;

    const generatedHistory =
      history?.trim() ||
      safeAnalysis?.summary ||
      (safeAnalysis?.conditions?.length
        ? `Medical analysis detected: ${safeAnalysis.conditions
            .map((condition) => condition.name)
            .filter(Boolean)
            .join(", ")}.`
        : "");

    const newEntry = {
      history: generatedHistory,
      date: date ? new Date(date) : new Date(),
      pdfUrl,
      analysis: safeAnalysis,
    };

    user.medicalHistory = user.medicalHistory || [];
    user.medicalHistory.push(newEntry);

    if (safeAnalysis?.flags?.length) {
      user.medicalFlags = [
        ...new Set([...(user.medicalFlags || []), ...safeAnalysis.flags]),
      ];
    }

    user.medicalFlags = buildHealthFlagsFromProfiles({
      medicalFlags: user.medicalFlags || [],
      injuryProfile: user.injuryProfile,
      accessibilityProfile: user.accessibilityProfile,
    });

    await user.save();

    return res.status(200).json({
      message: "Medical history updated",
      medicalHistory: user.medicalHistory,
      medicalFlags: user.medicalFlags || [],
      injuryProfile: user.injuryProfile || null,
      accessibilityProfile: user.accessibilityProfile || null,
    });
  } catch (err) {
    console.error("addMedicalHistory error:", err);

    return res.status(500).json({
      message: "Error processing medical file",
      error: err.message,
    });
  }
};

exports.getMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id).select(
      "medicalHistory medicalFlags injuryProfile accessibilityProfile",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const history = [...(user.medicalHistory || [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    const cleanHistory = history.map((entry) => ({
      _id: entry._id,
      date: entry.date,
      history: entry.history,
      pdfUrl: entry.pdfUrl || null,
      analysis: entry.analysis
        ? {
            summary: entry.analysis.summary || null,
            conditions: entry.analysis.conditions || [],
            flags: entry.analysis.flags || [],
          }
        : null,
    }));

    return res.status(200).json({
      medicalHistory: cleanHistory,
      medicalFlags: user.medicalFlags || [],
      injuryProfile: user.injuryProfile || null,
      accessibilityProfile: user.accessibilityProfile || null,
    });
  } catch (error) {
    console.error("Error fetching medical history:", error);

    return res.status(500).json({
      message: "Error fetching medical history.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// PREFERENCES
// ------------------------------------------------------
exports.addUserPreference = async (req, res) => {
  const { preference, date } = req.body;

  if (!preference || !date) {
    return res.status(400).json({
      message: "Preference and date are required.",
    });
  }

  try {
    const access = await canAccessTargetUser({
      req,
      targetUserId: req.params.id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.preferences.push({ preference, date });
    await user.save();

    return res.status(201).json({
      message: "Preference added successfully.",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Error adding user preference:", error);

    return res.status(500).json({
      message: "Error adding user preference.",
      error: error.message,
    });
  }
};

exports.getUserPreferences = async (req, res) => {
  const { id } = req.params;

  try {
    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id).select("preferences");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user.preferences || []);
  } catch (error) {
    console.error("Error fetching preferences:", error);

    return res.status(500).json({
      message: "Error fetching preferences.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// REGISTER USER LEGACY FLOW
// ------------------------------------------------------
exports.registerUser = async (req, res) => {
  const { name, email, password, role, gender } = req.body;

  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const emailToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: allowedRoles.includes(role) ? role : "basic",
      gender: allowedGender.includes(gender) ? gender : "female",
      emailToken,
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email/${emailToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: newUser.email,
      subject: "Email Confirmation",
      text: `Please confirm your email by clicking the link: ${confirmationUrl}`,
      html: `<p>Please confirm your email by clicking the link below:</p><a href="${confirmationUrl}">Confirm Email</a>`,
    });

    return res.status(201).json({
      message:
        "User registered successfully. Please confirm your email to activate your account.",
    });
  } catch (err) {
    console.error("Error registering user:", err);

    return res.status(500).json({
      message: "Error registering user.",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// NUTRITION HISTORY
// ------------------------------------------------------
exports.addNutritionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { calories, protein, carbs, fats, goal } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.nutritionHistory = user.nutritionHistory || [];

    user.nutritionHistory.push({
      date: new Date(),
      calories,
      protein,
      carbs,
      fats,
      goal,
    });

    await user.save();

    return res.status(200).json({
      message: "Nutrition history updated successfully",
      nutritionHistory: user.nutritionHistory,
    });
  } catch (error) {
    console.error("Error adding nutrition history:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// CYCLE SYSTEM
// ------------------------------------------------------
const buildCycleInsights = (cycle) => {
  const getCycleDay = (lastMenstruationDate) => {
    if (!lastMenstruationDate) return null;

    const today = new Date();
    const last = new Date(lastMenstruationDate);

    return Math.floor((today - last) / (1000 * 60 * 60 * 24));
  };

  const getPhase = (day) => {
    if (!day) return "unknown";
    if (day > 60) return "no_cycle";
    if (day <= 5) return "menstrual";
    if (day <= 13) return "follicular";
    if (day <= 16) return "ovulation";
    return "luteal";
  };

  const getLatestLog = (logs = []) => {
    if (!logs.length) return null;
    return logs[logs.length - 1];
  };

  const detectEnergyAvailability = (log) => {
    if (!log) return 3;

    const energy = Number(log.energy) || 0;
    const sleep = Number(log.sleep) || 0;
    const performance = Number(log.performance) || 0;
    const fatigue = Number(log.fatigue) || 0;

    const score = (energy + sleep + performance) / 3 - fatigue;

    return Math.max(1, Math.min(5, Math.round(score)));
  };

  const detectFlags = ({ day, cycleLength, log }) => {
    const flags = [];

    if (!cycleLength || Number(cycleLength) > 35) {
      flags.push("Irregular cycle");
    }

    if (day && day > 60) {
      flags.push("Amenorrhea risk");
    }

    if (log) {
      if (Number(log.energy) <= 2 && Number(log.performance) <= 2) {
        flags.push("Low energy availability");
      }

      if (Number(log.fatigue) >= 4 && Number(log.sleep) <= 2) {
        flags.push("Poor recovery state");
      }
    }

    return flags;
  };

  const getRecommendations = (phase, flags) => {
    const training = [];
    const nutrition = [];

    switch (phase) {
      case "menstrual":
        training.push("Low intensity training or rest");
        nutrition.push("Increase iron intake and hydration");
        break;
      case "follicular":
        training.push("Focus on strength and progressive overload");
        nutrition.push("Higher carbs to support performance");
        break;
      case "ovulation":
        training.push("High intensity sessions");
        nutrition.push("Optimize performance fueling");
        break;
      case "luteal":
        training.push("Moderate intensity training");
        nutrition.push("Stabilize blood sugar");
        break;
      case "no_cycle":
        training.push("Avoid high intensity training");
        nutrition.push("Increase caloric intake");
        break;
      default:
        training.push("Monitor readiness before adjusting training");
        nutrition.push("Maintain consistent fueling");
        break;
    }

    if (flags.includes("Low energy availability")) {
      training.unshift("Reduce training load immediately");
      nutrition.unshift("Increase caloric intake");
    }

    if (flags.includes("Amenorrhea risk")) {
      training.unshift("Avoid high intensity training");
      nutrition.unshift("Ensure sufficient energy intake");
    }

    return {
      training,
      nutrition,
    };
  };

  const day = getCycleDay(cycle.lastMenstruationDate);
  const phase = getPhase(day);
  const latestLog = getLatestLog(cycle.dailyLogs || []);
  const energyScore = detectEnergyAvailability(latestLog);

  const flags = detectFlags({
    day,
    cycleLength: cycle.cycleLength,
    log: latestLog,
  });

  return {
    currentPhase: phase,
    dayOfCycle: day,
    energyAvailabilityScore: energyScore,
    riskFlags: flags,
    recommendations: getRecommendations(phase, flags),
  };
};

exports.updateMyCycle = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    const { lastMenstruationDate, cycleLength } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!lastMenstruationDate) {
      return res.status(400).json({
        message: "lastMenstruationDate is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const prevCycle = user?.femaleProfile?.cycleData || {};

    const cycle = {
      lastMenstruationDate,
      cycleLength,
      dailyLogs: prevCycle.dailyLogs || [],
    };

    const insights = buildCycleInsights(cycle);

    const cleanCycle = {
      lastMenstruationDate,
      cycleLength,
      dailyLogs: cycle.dailyLogs,
      insights,
    };

    user.femaleProfile = user.femaleProfile || {};
    user.femaleProfile.cycleData = cleanCycle;

    await user.save();

    return res.status(200).json(cleanCycle);
  } catch (error) {
    console.error("updateMyCycle error:", error);

    return res.status(500).json({
      message: "Error updating cycle",
      error: error.message,
    });
  }
};

exports.addMyCycleLog = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { energy, fatigue, sleep, performance, mood } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const prevCycle = user?.femaleProfile?.cycleData || {};

    const updatedLogs = [
      ...(prevCycle?.dailyLogs || []),
      {
        energy,
        fatigue,
        sleep,
        performance,
        mood,
        date: new Date(),
      },
    ];

    const cycle = {
      lastMenstruationDate: prevCycle?.lastMenstruationDate,
      cycleLength: prevCycle?.cycleLength,
      dailyLogs: updatedLogs,
    };

    const insights = buildCycleInsights(cycle);

    const cleanCycle = {
      ...cycle,
      insights,
    };

    user.femaleProfile = user.femaleProfile || {};
    user.femaleProfile.cycleData = cleanCycle;

    await user.save();

    return res.status(200).json(cleanCycle);
  } catch (error) {
    console.error("addMyCycleLog error:", error);

    return res.status(500).json({
      message: "Error saving log",
      error: error.message,
    });
  }
};

exports.getMyCycle = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cycle = JSON.parse(
      JSON.stringify(user?.femaleProfile?.cycleData || {}),
    );

    return res.status(200).json(cycle);
  } catch (error) {
    console.error("getMyCycle error:", error);

    return res.status(500).json({
      message: "Error retrieving cycle",
      error: error.message,
    });
  }
};

exports.getUserCycle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cycle = JSON.parse(
      JSON.stringify(user?.femaleProfile?.cycleData || {}),
    );

    return res.status(200).json(cycle);
  } catch (error) {
    console.error("getUserCycle error:", error);

    return res.status(500).json({
      message: "Error retrieving user cycle",
      error: error.message,
    });
  }
};

///////////INJURIES//////////////

// ------------------------------------------------------
// INJURY PROFILE
// ------------------------------------------------------
exports.updateInjuryProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const injuryProfile = sanitizeInjuryProfile(req.body?.injuryProfile || req.body);

    const user = await User.findById(id).select(
      "injuryProfile accessibilityProfile medicalFlags"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.injuryProfile = injuryProfile;

    user.medicalFlags = buildHealthFlagsFromProfiles({
      medicalFlags: user.medicalFlags || [],
      injuryProfile,
      accessibilityProfile: user.accessibilityProfile,
    });

    await user.save();

    return res.status(200).json({
      message: "Injury profile updated successfully",
      injuryProfile: user.injuryProfile,
      medicalFlags: user.medicalFlags || [],
    });
  } catch (error) {
    console.error("updateInjuryProfile error:", error);

    return res.status(500).json({
      message: "Unable to update injury profile",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// ACCESSIBILITY PROFILE
// ------------------------------------------------------
exports.updateAccessibilityProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const access = await canAccessTargetUser({
      req,
      targetUserId: id,
    });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const accessibilityProfile = sanitizeAccessibilityProfile(
      req.body?.accessibilityProfile || req.body
    );

    const user = await User.findById(id).select(
      "injuryProfile accessibilityProfile medicalFlags"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.accessibilityProfile = accessibilityProfile;

    user.medicalFlags = buildHealthFlagsFromProfiles({
      medicalFlags: user.medicalFlags || [],
      injuryProfile: user.injuryProfile,
      accessibilityProfile,
    });

    await user.save();

    return res.status(200).json({
      message: "Accessibility profile updated successfully",
      accessibilityProfile: user.accessibilityProfile,
      medicalFlags: user.medicalFlags || [],
    });
  } catch (error) {
    console.error("updateAccessibilityProfile error:", error);

    return res.status(500).json({
      message: "Unable to update accessibility profile",
      error: error.message,
    });
  }
};