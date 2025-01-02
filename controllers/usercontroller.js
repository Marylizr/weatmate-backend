const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator");

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

    if (id === 'me') {
      if (!req.sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(req.sessionUser);
    } else {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(user);
    }
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve user", error: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    if (!req.sessionUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(req.sessionUser);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve user", error: err.message });
  }
};

// Create a new user
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
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

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    if (trainerId) {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "personal-trainer") {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    const allowedRoles = ["basic", "admin", "personal-trainer"];
    let assignedRole = allowedRoles.includes(role) ? role : "basic";

    if (["admin", "personal-trainer"].includes(role)) {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to assign this role" });
      }
      assignedRole = role;
    }

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
    };

    if (assignedRole === "personal-trainer") {
      if (degree) newUserData.degree = degree;
      if (experience) newUserData.experience = experience;
      if (specializations) newUserData.specializations = specializations;
      if (bio) newUserData.bio = bio;
      if (location) newUserData.location = location;
    }

    const newUser = new User(newUserData);
    const userSaved = await newUser.save();

    const token = jwt.sign({ id: userSaved._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({
      token,
      id: userSaved._id,
      role: userSaved.role,
      name: userSaved.name,
    });
  } catch (err) {
    console.error('Error creating user:', err);
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
  const { id } = req.params;
  const loggedInUser = req.sessionUser;

  try {
    let userToUpdate;

    if (id) {
      if (loggedInUser.role !== "admin") {
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

    res.status(200).json({ message: "User has been updated successfully", updatedUser: userToUpdate });
  } catch (err) {
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
