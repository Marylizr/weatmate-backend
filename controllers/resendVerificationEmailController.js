require("dotenv").config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    accessToken: process.env.OAUTH_ACCESS_TOKEN,
  },
});

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.verified) {  // Ensure this field matches the database
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate a new verification token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;

    // Send email
    const mailOptions = {
      from: process.env.GOOGLE_EMAIL_USER,
      to: email,
      subject: "Verify Your Email - SweatMate",
      html: `
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification email resent successfully." });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ message: "Error resending verification email.", error: error.message });
  }
};
