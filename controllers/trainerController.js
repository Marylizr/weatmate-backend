const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const ClientProfile = require("../models/ClientProfileModel");

exports.trainerCreateClient = async (req, res) => {
  try {
    const trainerId = req.user._id;

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "basic",
      trainerId: trainerId,
      isVerified: false,
    });

    await ClientProfile.create({
      userId: newUser._id,
      assignedTrainerId: trainerId,
      status: "active",
    });

    return res.status(201).json({
      message: "Client created. Please ask the client to verify their email.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("trainerCreateClient error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
