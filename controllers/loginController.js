const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); 

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Secure cookie setup for Netlify + Heroku
    res.cookie('token', token, {
      httpOnly: true,        // Prevents JS access to the cookie
      secure: true,          // Only over HTTPS (required by Netlify)
      sameSite: 'None',      // Needed for cross-origin requests between Netlify and Heroku
    });

    // Send session data (no token in response, it's in the cookie)
    res.status(200).json({
      id: user._id,
      role: user.role,
      name: user.name
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
