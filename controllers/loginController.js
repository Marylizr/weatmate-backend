const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Adjust the path based on your structure


exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.cookie('token', token, {
    httpOnly: true,       // Prevent JavaScript access (secure)
    secure: true,         // Ensure it's sent over HTTPS
    sameSite: 'None',     // Required for cross-origin cookies
  });

  res.status(200).json({
    id: user._id,
    role: user.role,
    name: user.name,
    message: "Login successful",
  });
};
