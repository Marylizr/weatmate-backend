const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,                                      // Prevents JS access to the cookie (security)
      secure: process.env.NODE_ENV === 'production',       // Ensures HTTPS in production, HTTP in development
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',  // Allows cross-origin in production
      domain: process.env.NODE_ENV === 'production' ? '.netlify.app' : 'localhost',  // For Netlify in production
      path: '/',                                           // Cookie valid for the entire site
    });
    

    console.log("Token sent in cookie:", token);

    res.status(200).json({
      token,
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
