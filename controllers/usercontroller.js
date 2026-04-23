require("dotenv").config();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const mongoose = require("mongoose");
const { buildInsights } = require("../services/cycleEngine");

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
const safeObj = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

// ---------- FLAGS (REDS / LEA / Amenorrhea) ----------
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
  if (amenorrheaRisk) rationale += " + amenorrhea_indicators";

  return {
    redS_risk: redSRisk,
    lea_risk: leaRisk,
    amenorrhea_risk: amenorrheaRisk,
    lastCalculatedAt: new Date(),
    rationale,
  };
};

// Trainer can only access users whose trainerId === trainerUserId
const canTrainerAccessClient = async (trainerUserId, clientId) => {
  const client = await User.findById(clientId).select("trainerId role");
  if (!client) return { ok: false, status: 404, message: "User not found." };

  if (String(client.trainerId || "") !== String(trainerUserId)) {
    return { ok: false, status: 403, message: "Access denied." };
  }

  return { ok: true, client };
};

// ---------- FEMALE PROFILE SANITIZER (partial patch) ----------
const sanitizeFemaleProfile = (incoming = {}) => {
  const fp = safeObj(incoming);
  const out = {};

  if (typeof fp.lifeStage !== "undefined") out.lifeStage = fp.lifeStage;
  if (typeof fp.cycleTrackingEnabled !== "undefined")
    out.cycleTrackingEnabled = !!fp.cycleTrackingEnabled;

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

    cycleKeys.forEach((k) => {
      if (typeof c[k] !== "undefined") out.cycle[k] = c[k];
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
      symptomKeys.forEach((k) => {
        if (typeof s[k] !== "undefined") out.cycle.symptoms[k] = s[k];
      });
    }
  }

  if (typeof fp.contraception !== "undefined") {
    const cc = safeObj(fp.contraception);
    out.contraception = {};
    const keys = ["usesHormonalContraception", "method", "startedAt", "notes"];
    keys.forEach((k) => {
      if (typeof cc[k] !== "undefined") {
        out.contraception[k] =
          k === "usesHormonalContraception" ? !!cc[k] : cc[k];
      }
    });
  }

  if (typeof fp.hormoneTherapy !== "undefined") {
    const ht = safeObj(fp.hormoneTherapy);
    out.hormoneTherapy = {};
    const keys = ["usesHRT", "type", "startedAt", "notes"];
    keys.forEach((k) => {
      if (typeof ht[k] !== "undefined") {
        out.hormoneTherapy[k] = k === "usesHRT" ? !!ht[k] : ht[k];
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
    keys.forEach((k) => {
      if (typeof ea[k] !== "undefined") out.energyAvailability[k] = ea[k];
    });
  }

  if (typeof fp.clinicalFlags !== "undefined") {
    const f = safeObj(fp.clinicalFlags);
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
    keys.forEach((k) => {
      if (typeof f[k] !== "undefined") out.clinicalFlags[k] = !!f[k];
    });
  }

  if (typeof fp.trainingConsiderations !== "undefined") {
    const t = safeObj(fp.trainingConsiderations);
    out.trainingConsiderations = {};
    const keys = [
      "preferredIntensityOnLuteal",
      "painLimitationsNotes",
      "fatigueNotes",
    ];
    keys.forEach((k) => {
      if (typeof t[k] !== "undefined") out.trainingConsiderations[k] = t[k];
    });
  }

  out.updatedAt = new Date();
  return out;
};

// ---------- FEMALE PROFILE DEEP MERGE ----------
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
// Auth token helper
// ------------------------------------------------------
exports.generateToken = (userId, role, gender) => {
  return jwt.sign({ id: userId, role, gender }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// ------------------------------------------------------
// Basic user reads
// ------------------------------------------------------
exports.findOne = async (req, res) => {
  try {
    // 🔥 FIX REAL → soporta ambos casos (id y _id)
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid user session" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      gender: user.gender,
      fitness_level: user.fitness_level,
      goal: user.goal,
      age: user.age,
      weight: user.weight,
      height: user.height,
      degree: user.degree,
      experience: user.experience,
      specializations: user.specializations,
      bio: user.bio,
      location: user.location,
      trainerId: user.trainerId,
      femaleProfile: user.femaleProfile || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Unable to retrieve users", error: err.message });
  }
};

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: "personal-trainer" }).select(
      "name email _id",
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
    if (!userData) return res.status(404).json({ message: "User not found" });
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
    if (!userData) return res.status(404).json({ message: "User not found" });
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
      if (!req.sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        ...req.sessionUser,
        femaleProfile: req.sessionUser.femaleProfile || null,
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      ...user.toObject(),
      femaleProfile: user.femaleProfile || null,
    });
  } catch (err) {
    console.error("Error retrieving user:", err.message);
    return res
      .status(500)
      .json({ message: "Unable to retrieve user", error: err.message });
  }
};

// ------------------------------------------------------
// OAuth / Email verification
// ------------------------------------------------------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

exports.oauth2callback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Authorization code not provided.");

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
    return res
      .status(400)
      .json({ success: false, message: "Token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email is already verified." });
    }

    user.isVerified = true;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification link expired. Please request a new one.",
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

// If you want this route to work as POST /user/send-verification,
// your frontend should pass a userId OR you should infer from auth.
// Leaving it compatible: if req.body.userId exists, use it.
exports.sendVerificationEmail = async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid userId is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
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
// Create user (admin)
// ------------------------------------------------------
exports.createUserByAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only admins can create users." });
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
      medical_history,
      medicalHistoryFile,
      preferences,
      sessionNotes,
    } = req.body;

    if (
      !password ||
      typeof password !== "string" ||
      password.trim().length < 8
    ) {
      return res.status(400).json({
        message: "Password is required and must be at least 8 characters long.",
      });
    }

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    if (trainerId) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer ID format" });
      }
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "personal-trainer") {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }
    }

    const allowedRoles = ["basic", "admin", "personal-trainer"];
    const assignedRole = allowedRoles.includes(role) ? role : "basic";
    const isVerified =
      assignedRole === "admin" || assignedRole === "personal-trainer";

    const passwordHashed = await bcrypt.hash(password.trim(), 10);

    const newUserData = {
      name,
      email: normalizedEmail,
      password: passwordHashed,
      age,
      weight,
      height,
      goal,
      gender,
      role: assignedRole,
      trainerId,
      fitness_level,
      medical_history,
      medicalHistoryFile,
      preferences,
      sessionNotes,
      isVerified,
    };

    if (assignedRole === "personal-trainer") {
      newUserData.personalTrainerInfo = {
        name,
        email: normalizedEmail,
        degree,
        experience,
        specializations,
        bio,
        location,
      };
    }

    const newUser = new User(newUserData);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      token,
      id: newUser._id,
      role: newUser.role,
      name: newUser.name,
      message: isVerified
        ? "Admin or Personal Trainer account created successfully."
        : "Account created successfully. Please verify your email to activate your account.",
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return res
      .status(500)
      .json({ message: "Unable to create user", error: err.message });
  }
};

// ------------------------------------------------------
// Public signup
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
    } = req.body;

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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const assignedRole = "basic";
    const passwordHashed = await bcrypt.hash(password.trim(), 10);

    const newUserData = {
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHashed,
      age: age ?? undefined,
      weight: weight ?? undefined,
      height: height ?? undefined,
      goal: goal ?? undefined,
      gender: gender ?? undefined,
      role: assignedRole,
      fitness_level: fitness_level ?? undefined,
      isVerified: false,
    };

    const newUser = new User(newUserData);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      token,
      id: newUser._id,
      role: newUser.role,
      gender: newUser.gender,
      name: newUser.name,
      message:
        "Account created successfully. Please verify your email to activate your account.",
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return res
      .status(500)
      .json({ message: "Unable to create user", error: err.message });
  }
};

// ------------------------------------------------------
// Delete user
// ------------------------------------------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await User.deleteOne({ _id: id });
    return res.status(200).json({ message: "User was deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Unable to delete user", error: err.message });
  }
};

// ------------------------------------------------------
// Update user profile (PUT /user, /user/me, /user/:id)
// ------------------------------------------------------
exports.update = async (req, res) => {
  try {
    const paramId = req.params?.id;
    const authUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin";

    let targetUserId = null;

    if (paramId && paramId !== "me") {
      targetUserId = String(paramId);
      if (!isAdmin && authUserId && String(authUserId) !== targetUserId) {
        return res.status(403).json({ message: "Access denied." });
      }
    } else {
      if (!authUserId)
        return res.status(401).json({ message: "Unauthorized." });
      targetUserId = String(authUserId);
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const updateData = { ...req.body };

    if (!isAdmin) {
      if (typeof updateData.trainerId !== "undefined") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
      if (typeof updateData.role !== "undefined") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
      if (typeof updateData.isVerified !== "undefined") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "password")) {
      const raw =
        typeof updateData.password === "string"
          ? updateData.password.trim()
          : "";

      if (!raw) {
        delete updateData.password;
      } else {
        if (raw.length < 8) {
          return res.status(400).json({
            message: "Password must be at least 8 characters long.",
          });
        }
        updateData.password = await bcrypt.hash(raw, 10);
      }
    }

    if (typeof updateData.email === "string") {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    if (typeof updateData.name === "string") {
      updateData.name = updateData.name.trim();
    }

    Object.keys(updateData).forEach((k) => {
      if (typeof updateData[k] === "undefined") delete updateData[k];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const updatedUser = await User.findByIdAndUpdate(targetUserId, updateData, {
      new: true,
      runValidators: true,
      context: "query",
      select: "-password",
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found." });

    return res.status(200).json(updatedUser);
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: "Email already in use." });
    }

    console.error("Error updating user:", err);
    return res.status(500).json({
      message: "Unable to update user",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// Female profile endpoints (NO duplicate export names)
// ------------------------------------------------------

// PUT /user/femaleProfile (self)
// Body: { femaleProfile: { ...patch } }
exports.updateMyFemaleProfile = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    if (!authUserId) return res.status(401).json({ message: "Unauthorized." });

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
    if (!user) return res.status(404).json({ message: "User not found." });

    user.femaleProfile = mergeFemaleProfile(user.femaleProfile, patch);
    await user.save();

    return res.status(200).json({ femaleProfile: user.femaleProfile });
  } catch (err) {
    console.error("updateMyFemaleProfile error:", err);
    return res.status(500).json({
      message: "Unable to update female profile",
      error: err.message,
    });
  }
};

// PATCH /user/:id/femaleProfile (trainer/admin)
// Body: { femaleProfile: { ...patch } }
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
    if (!user) return res.status(404).json({ message: "User not found." });

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

// GET /user/clientSnapshot/:id (trainer/admin)
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
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      gender: user.gender,
      fitness_level: user.fitness_level,
      goal: user.goal,
      age: user.age,
      weight: user.weight,
      height: user.height,
      trainerId: user.trainerId,
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
// Session notes
// ------------------------------------------------------
exports.addSessionNote = async (req, res) => {
  const { note, date } = req.body;

  if (!note || !date) {
    return res.status(400).json({ message: "Note and date are required." });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

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
    const user = await User.findById(id).select("sessionNotes");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json(user.sessionNotes);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching session notes.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// Medical history
// ------------------------------------------------------
exports.addMedicalHistory = async (req, res) => {
  const { history, date } = req.body;

  if (!history || !date) {
    return res.status(400).json({ message: "History and date are required." });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.medicalHistory.push({ history, date });
    await user.save();

    return res.status(201).json({
      message: "Medical record added successfully.",
      medicalHistory: user.medicalHistory,
    });
  } catch (error) {
    console.error("Error adding medical record:", error);
    return res.status(500).json({
      message: "Error adding medical record.",
      error: error.message,
    });
  }
};

exports.getMedicalHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("medicalHistory");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json(user.medicalHistory);
  } catch (error) {
    console.error("Error fetching medical history:", error);
    return res.status(500).json({
      message: "Error fetching medical history.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// Preferences
// ------------------------------------------------------
exports.addUserPreference = async (req, res) => {
  const { preference, date } = req.body;

  if (!preference || !date) {
    return res
      .status(400)
      .json({ message: "Preference and date are required." });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

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
    const user = await User.findById(id).select("preferences");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json(user.preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return res.status(500).json({
      message: "Error fetching preferences.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// Register user (legacy flow)
// ------------------------------------------------------
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({
      email: String(email || "")
        .trim()
        .toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(String(password || ""), 10);
    const emailToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email: String(email || "")
        .trim()
        .toLowerCase(),
      password: hashedPassword,
      role,
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
    return res
      .status(500)
      .json({ message: "Error registering user.", error: err.message });
  }
};

// ------------------------------------------------------
// Nutrition history
// ------------------------------------------------------
exports.addNutritionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { calories, protein, carbs, fats, goal } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

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
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------
// CYCLE SYSTEM (SINGLE SOURCE OF TRUTH - HARDENED)
// ------------------------------------------------------

const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));

// -----------------------------
// BUILD INSIGHTS (INLINE SAFE)
// -----------------------------
const buildCycleInsights = (cycle) => {
  const getCycleDay = (lastMenstruationDate) => {
    if (!lastMenstruationDate) return null;

    const today = new Date();
    const last = new Date(lastMenstruationDate);

    return Math.floor((today - last) / (1000 * 60 * 60 * 24));
  };

  const getPhase = (day) => {
    if (!day) return "unknown";
    if (day > 60) return "no_cycle"; // 🔥 AMENORRHEA HARD RULE

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

    const score = (log.energy + log.sleep + log.performance) / 3 - log.fatigue;

    return Math.max(1, Math.min(5, Math.round(score)));
  };

  const detectFlags = ({ day, cycleLength, log }) => {
    const flags = [];

    if (!cycleLength || cycleLength > 35) {
      flags.push("Irregular cycle");
    }

    if (day && day > 60) {
      flags.push("Amenorrhea risk");
    }

    if (log) {
      if (log.energy <= 2 && log.performance <= 2) {
        flags.push("Low energy availability");
      }

      if (log.fatigue >= 4 && log.sleep <= 2) {
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
    }

    if (flags.includes("Low energy availability")) {
      training.unshift("Reduce training load immediately");
      nutrition.unshift("Increase caloric intake");
    }

    if (flags.includes("Amenorrhea risk")) {
      training.unshift("Avoid high intensity training");
      nutrition.unshift("Ensure sufficient energy intake");
    }

    return { training, nutrition };
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

// -----------------------------
// UPDATE MY CYCLE
// -----------------------------
exports.updateMyCycle = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    console.log("AUTH USER:", userId);
    console.log("BODY RECEIVED:", req.body);

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

// -----------------------------
// ADD DAILY LOG
// -----------------------------
exports.addMyCycleLog = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

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
      { energy, fatigue, sleep, performance, mood },
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

// -----------------------------
// GET MY CYCLE
// -----------------------------
exports.getMyCycle = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

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

// -----------------------------
// GET USER CYCLE (TRAINER / ADMIN)
// -----------------------------
exports.getUserCycle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
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