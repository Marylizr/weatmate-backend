require('dotenv').config();
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const mongoose = require("mongoose");


exports.generateToken = (userId, role, gender) => {
  // Generate a JWT with the user ID, role, and gender
  return jwt.sign(
    { id: userId, role, gender }, // Include user details in the payload
    process.env.JWT_SECRET, // Secret from .env file
    { expiresIn: "1h" } // Token expires in 1 hour
  );
};

exports.findOne = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password from response
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
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
      trainerId:user.trainerId,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.findAll = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve users", error: err.message });
  }
};

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'personal-trainer' }).select('name email _id');
    res.status(200).json(trainers);
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve trainers', error: error.message });
  }
};



exports.findOneName = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id).select('name');
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userData.name);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve user name", error: err.message });
  }
};

exports.findOneEmail = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id).select('email');
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userData.email);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve user email", error: err.message });
  }
};

exports.findOneId = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "me") {
      console.log("Session User for /me:", req.sessionUser);
      if (!req.sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(req.sessionUser);
    } else {
      const user = await User.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(user);
    }
  } catch (err) {
    console.error("Error retrieving user:", err.message);
    res.status(500).json({ message: "Unable to retrieve user", error: err.message });
  }
};

  

//AUTH

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate Google authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});


// OAuth2 callback for exchanging authorization code
exports.oauth2callback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      process.env.OAUTH_REFRESH_TOKEN = tokens.refresh_token;
    } else {
      console.warn('No refresh token received. Ensure "prompt=consent" is used in authUrl.');
    }

    return res.status(200).send('Authorization successful! Tokens acquired.');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.message);
    res.status(500).send('Failed to exchange code for tokens.');
  }
};

// Create transporter with nodemailer
async function createTransporter() {
  try {
    if (!process.env.OAUTH_REFRESH_TOKEN) {
      throw new Error("Refresh token is missing. Reauthorize the app to obtain it.");
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const { token: accessToken } = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      secure: true,
      service: 'gmail',
      auth: {
        user:process.env.GOOGLE_EMAIL_USER,
        pass:process.env.GOOGLE_EMAIL_PASSWORD,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Error creating transporter:", error.message);
    throw new Error("Failed to create transporter.");
  }
}



// Confirm email verification
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Ensure we use `_id` for MongoDB lookup
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error(`User not found for ID: ${decoded.userId}`);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: "Email is already verified." });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification link expired. Please request a new one.",
      });
    }

    return res.status(400).json({ success: false, message: "Invalid or expired token." });
  }
};


// Send verification email
exports.sendVerificationEmail = async (user) => {
  if (!user.email) {
    console.error("No email found for user:", user);
    return false;
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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

  try {
    console.log("Creating email transporter...");
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", user.email);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    return false;
  }
};


//CREATE
exports.createUserByAdmin = async (req, res) => {
  console.log("Checking `req.user` inside `createUserByAdmin` function:", req.user);

  try {
    if (!req.user || req.user.role !== "admin") {
      console.log("Unauthorized: Only admins can create users.");
      return res.status(403).json({ message: "Unauthorized: Only admins can create users." });
    }

    console.log("Incoming Request Body:", req.body);

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

    if (!password || typeof password !== "string" || password.trim().length < 8) {
      console.log("Error: Invalid password input.");
      return res.status(400).json({ message: "Password is required and must be at least 8 characters long." });
    }

    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already exists:", email);
      return res.status(409).json({ message: "Email already in use" });
    }

    if (trainerId) {
      console.log("Validating Trainer ID:", trainerId);
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer ID format" });
      }
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "personal-trainer") {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }
    }

    console.log("Assigning Role...");
    const allowedRoles = ["basic", "admin", "personal-trainer"];
    const assignedRole = allowedRoles.includes(role) ? role : "basic";

    // Automatically verify admins and personal trainers
    const isVerified = assignedRole === "admin" || assignedRole === "personal-trainer";

    console.log("Hashing Password...");
    const passwordHashed = await bcrypt.hash(password.trim(), 10);
    console.log("Password Hashed Successfully");

    console.log("Preparing User Data...");
    const newUserData = {
      name,
      email,
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
      isVerified, // Automatically set verification for admins & trainers
    };

    if (assignedRole === "personal-trainer") {
      newUserData.personalTrainerInfo = { name, email, degree, experience, specializations, bio, location };
    }

    console.log("Creating User in Database...");
    const newUser = new User(newUserData);
    await newUser.save();
    console.log("User Successfully Created:", newUser);

    console.log("Generating JWT Token...");
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("JWT Token Created Successfully:", token);

    res.status(201).json({
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
    res.status(500).json({ message: "Unable to create user", error: err.message });
  }
};


// Create a new user

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
      role,
      gender,
      trainerId,
      fitness_level,
    } = req.body;

    if (!password || typeof password !== "string" || password.trim().length < 8) {
      console.log("Error: Invalid password input.");
      return res.status(400).json({ message: "Password is required and must be at least 8 characters long." });
    }

    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already exists:", email);
      return res.status(409).json({ message: "Email already in use" });
    }

    if (trainerId) {
      console.log("Validating Trainer ID:", trainerId);
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer ID format" });
      }
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "personal-trainer") {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }
    }

    console.log("Assigning Role...");
    const allowedRoles = ["basic", "admin", "personal-trainer"];
    const assignedRole = allowedRoles.includes(role) ? role : "basic";

    console.log("Hashing Password...");
    const passwordHashed = await bcrypt.hash(password.trim(), 10);
    console.log("Password Hashed Successfully");

    console.log("Preparing User Data...");
    const newUserData = {
      name,
      email,
      password: passwordHashed,
      age,
      weight,
      height,
      goal,
      gender,
      role: assignedRole,
      trainerId,
      fitness_level,
      isVerified: false, // Ensure users need verification
    };

    console.log("Creating User in Database...");
    const newUser = new User(newUserData);
    await newUser.save();
    console.log("User Successfully Created:", newUser);

    console.log("Generating JWT Token...");
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("JWT Token Created Successfully:", token);

    console.log("Sending Verification Email...");
    // Send verification email if necessary
    if (!newUser.isVerified) {
      try {
        await exports.sendVerificationEmail(newUser);
      } catch (error) {
        console.error("Failed to send verification email:", error.message);
      }
    }

    res.status(201).json({
      token,
      id: newUser._id,
      role: newUser.role,
      name: newUser.name,
      message: "Account created successfully. Please verify your email to activate your account.",
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Unable to create user", error: err.message });
  }
};



exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await User.deleteOne({ _id: id });
    res.status(200).json({ message: "User was deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Unable to delete user", error: err.message });
  }
};

// Update user profile
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.sessionUser;

    console.log("Incoming Update Request:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    let userToUpdate;

    if (id) {
      if (!loggedInUser || loggedInUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can update other users' profiles." });
      }
      userToUpdate = await User.findById(id);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      userToUpdate = loggedInUser;
    }

    const { password, email, ...updateData } = req.body;

    if (email && email !== userToUpdate.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userToUpdate._id.toString()) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateData.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    Object.assign(userToUpdate, updateData);

    await userToUpdate.save();

    console.log("User Updated Successfully:", userToUpdate);

    res.status(200).json({ message: "User has been updated successfully", updatedUser: userToUpdate });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ message: "Unable to update user", error: err.message });
  }
};




exports.addSessionNote = async (req, res) => {
  console.log('Request Params:', req.params); // Should log the user ID
  console.log('Request Headers:', req.headers); // Should include Content-Type: application/json
  console.log('Request Body:', req.body); // Should contain { note, date }

  const { note, date } = req.body;

  if (!note || !date) {
    console.log('Validation failed:', { note, date });
    return res.status(400).json({ message: 'Note and date are required.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.sessionNotes.push({ note, date });
    await user.save();
    res.status(201).json({ message: 'Session note added successfully.', sessionNotes: user.sessionNotes });
  } catch (error) {
    console.error('Error adding session note:', error);
    res.status(500).json({ message: 'Error adding session note.', error: error.message });
  }
};



exports.getSessionNotes = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('sessionNotes');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user.sessionNotes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session notes.', error: error.message });
  }
};



// Controller to handle medical history
exports.addMedicalHistory = async (req, res) => {
  console.log('Request Params:', req.params); // Should log the user ID
  console.log('Request Headers:', req.headers); // Should include Content-Type: application/json
  console.log('Incoming Request Body:', req.body); // Should contain { history, date }

  const { history, date } = req.body;

  if (!history || !date) {
    console.log('Validation failed:', { history, date });
    return res.status(400).json({ message: 'History and date are required.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.medicalHistory.push({ history, date });
    await user.save();
    res.status(201).json({ message: 'Medical record added successfully.', medicalHistory: user.medicalHistory });
  } catch (error) {
    console.error('Error adding medical record:', error);
    res.status(500).json({ message: 'Error adding medical record.', error: error.message });
  }
};




exports.getMedicalHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('medicalHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user.medicalHistory);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ message: 'Error fetching medical history.', error: error.message });
  }
};


// Add or Update User Preferences
exports.addUserPreference = async (req, res) => {
  console.log('Request Params:', req.params); // Logs the user ID
  console.log('Request Headers:', req.headers); // Logs request headers
  console.log('Request Body:', req.body); // Logs parsed body

  const { preference, date } = req.body;

  if (!preference || !date) {
    console.log('Validation failed:', { preference, date });
    return res.status(400).json({ message: 'Preference and date are required.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.preferences.push({ preference, date });
    await user.save();
    res.status(201).json({ message: 'Preference added successfully.', preferences: user.preferences });
  } catch (error) {
    console.error('Error adding user preference:', error);
    res.status(500).json({ message: 'Error adding user preference.', error: error.message });
  }
};

exports.getUserPreferences = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('preferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user.preferences);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ message: 'Error fetching medical history.', error: error.message });
  }
};



exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailToken = crypto.randomBytes(32).toString('hex'); // Generate a unique token

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      emailToken,
    });

    await newUser.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Adjust this based on your email provider
      auth: {
        user: process.env.EMAIL, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
      },
    });

    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email/${emailToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Email Confirmation',
      text: `Please confirm your email by clicking the link: ${confirmationUrl}`,
      html: `<p>Please confirm your email by clicking the link below:</p><a href="${confirmationUrl}">Confirm Email</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'User registered successfully. Please confirm your email to activate your account.',
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user.', error: err.message });
  }
};
