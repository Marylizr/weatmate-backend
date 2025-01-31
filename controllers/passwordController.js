const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

// Forgot Password - Sends a reset email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });

    res.status(200).json({ message: "Reset link sent to email." });

  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Error sending email. Try again later." });
  }
};

// Verify Reset Token - Checks if token is valid
exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure token is still valid
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token." });

    res.status(200).json({ message: "Token is valid." });

  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ message: "Error verifying token." });
  }
};

// Reset Password - Updates the User's Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure token is valid
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token." });

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });

  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};
