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

  const { name, email, password, age, weight, height, goal, role, gender, degree, experience, specializations, bio, location } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    // Only add admin-specific fields if the user is an admin
    const newUserData = {
      name,
      email,
      password: passwordHashed,
      age,
      weight,
      height,
      goal,
      gender,
      role: role || "basic"
    };

    if (role === "admin") {
      newUserData.degree = degree;
      newUserData.experience = experience;
      newUserData.specializations = specializations;
      newUserData.bio = bio;
      newUserData.location = location;
    }

    const newUser = new User(newUserData);
    const userSaved = await newUser.save();

    const token = jwt.sign({ id: userSaved._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      token,
      id: userSaved._id,
      role: userSaved.role,
      userName: userSaved.name
    });
  } catch (err) {
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
  const { id } = req.params; // Get user ID from request parameters

  // Check if the user exists
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password, ...updateData } = req.body;

  try {
    // Handle password update
    if (password && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    } else {
      updateData.password = user.password; // Keep the existing password if not changing
    }

    // Only update admin-specific fields if the user is an admin
    if (user.role === "admin") {
      updateData.degree = req.body.degree || user.degree;
      updateData.experience = req.body.experience || user.experience;
      updateData.specializations = req.body.specializations || user.specializations;
      updateData.bio = req.body.bio || user.bio;
      updateData.location = req.body.location || user.location;
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');

    res.status(200).json({ message: "User has been updated successfully", updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Unable to update user", error: err.message });
  }
};
