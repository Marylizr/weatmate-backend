const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request received with email:", email);

    if (!email || !password) {
      console.log("Missing email or password in request");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("User found in DB:", { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      gender: user.gender 
    });

    // Validate the password
    console.log("Comparing password for user:", email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Ensure JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET is missing." });
    }

    // Ensure user role and gender exist
    if (!user.role || !user.gender) {
      console.error("User is missing role or gender:", { role: user.role, gender: user.gender });
      return res.status(500).json({ message: "User data is incomplete. Contact support." });
    }

    // Generate JWT token
    console.log("Generating JWT token...");
    const token = jwt.sign(
      { id: user._id, role: user.role, gender: user.gender },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("JWT token generated successfully:", token);

    // Return full user details in response to prevent frontend session issues
    res.status(200).json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image || "",  
      role: user.role,
      gender: user.gender,
      age: user.age || null,
      weight: user.weight || null,
      height: user.height || null,
      goal: user.goal || "",
      degree: user.degree || "",
      experience: user.experience || 0,
      specializations: user.specializations || "",
      bio: user.bio || "",
      location: user.location || "",
      trainerId: user.trainerId || "",
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login Error:", error);  // Full error object
    res.status(500).json({ message: "Server error during login", error: error.toString() });
  }
};
