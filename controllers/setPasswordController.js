const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

exports.setPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: "User ID and new password are required." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error setting new password:", error);
    res.status(500).json({ message: "Failed to update password." });
  }
};
