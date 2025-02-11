const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set the cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // Secure only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',  // Allow cross-origin in production
    });
    
    // Ensure the token is also in the response body
    res.status(200).json({
      token,  // <--- This is critical for the frontend
      id: user._id,
      role: user.role,
      name: user.name,
      gender: user.gender,
      message: "Login successful",
    });
    
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

