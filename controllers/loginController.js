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

    // Validate the password
    console.log("Comparing password for user:", email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    console.log("Generating JWT token...");
    const token = jwt.sign(
      { id: user._id, role: user.role, gender: user.gender },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("JWT token generated successfully:", token);

    // Return token and user details
    res.status(200).json({
      token,
      id: user._id,
      role: user.role,
      name: user.name,
      gender: user.gender,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login Error:", error);  // Full error object
    res.status(500).json({ message: "Server error during login", error: error.toString() });
  }
};

