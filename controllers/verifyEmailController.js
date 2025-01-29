require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');


// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate Google authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});
console.log(`Authorize your app by visiting this URL: ${authUrl}`);



exports.oauth2callback = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required." });
  }

  try {
    // Verify the token and decode the user ID or email
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Retrieve user details from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Return user details (including gender)
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        gender: user.gender, // Include gender from the user record
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error processing OAuth callback:", error);
    return res.status(500).json({ success: false, message: "Authentication failed." });
  }
};
