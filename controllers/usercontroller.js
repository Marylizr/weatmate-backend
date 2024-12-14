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
    const userData = await User.findOne({ email: req.params.email }).select('_id');
    if (!userData) {
      return res.status(404).json(null);
    }
    res.status(200).json(userData._id);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve user ID", error: err.message });
  }
};




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
  } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Check if the trainerId is valid if provided
    if (trainerId) {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "personal-trainer") {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    // Allow users to assign only 'basic', 'medium', or 'advanced' roles
    const allowedRoles = ["basic", "medium", "advanced"];
    let assignedRole = role && allowedRoles.includes(role) ? role : "basic";

    // Ensure only admins can create personal trainers or admins
    if (["admin", "personal-trainer"].includes(role)) {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to assign this role" });
      }
      assignedRole = role;
    }

    // Create new user data object
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
    };

    // Add personal trainer-specific fields if the role is 'personal-trainer' and fields are provided
    if (assignedRole === "personal-trainer") {
      if (degree) newUserData.degree = degree;
      if (experience) newUserData.experience = experience;
      if (specializations) newUserData.specializations = specializations;
      if (bio) newUserData.bio = bio;
      if (location) newUserData.location = location;
    }

    const newUser = new User(newUserData);
    const userSaved = await newUser.save();

    const token = jwt.sign({ id: userSaved._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      token,
      id: userSaved._id,
      role: userSaved.role,
      userName: userSaved.name,
    });
  } catch (err) {
    console.error('Error creating user:', err); // Log the error for debugging
    res.status(500).json({ message: "Unable to create user", error: err.message });
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

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await User.deleteOne({ _id: id });
    res.status(200).json({ message: "User was deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Unable to delete user", error: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params; // Get the user ID from the request parameters
  const loggedInUser = req.sessionUser; // The currently logged-in user (admin)

  let userToUpdate;

  try {
    // Determine which user to update
    if (id) {
      // If 'id' is provided, fetch the user to be updated (only allowed for admins)
      if (loggedInUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can update other users' profiles." });
      }

      userToUpdate = await User.findById(id);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      // If no 'id' is provided, update the logged-in user's profile
      userToUpdate = loggedInUser;
    }

    const { password, email, ...updateData } = req.body;

    // Check if the email is being updated and if it already exists for another user
    if (email && email !== userToUpdate.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userToUpdate._id.toString()) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateData.email = email;
    }

    // Handle password update if a new password is provided
    if (password && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Prepare fields to update
    const fieldsToUpdate = {
      ...userToUpdate.toObject(), // Keep all existing data
      ...updateData,              // Merge with updated data
      email: updateData.email || userToUpdate.email,
      password: updateData.password || userToUpdate.password,
    };

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
      userToUpdate._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ message: "User has been updated successfully", updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Unable to update user", error: err.message });
  }
};
