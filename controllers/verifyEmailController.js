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
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not provided.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      process.env.OAUTH_REFRESH_TOKEN = tokens.refresh_token; // Store this securely
    }

    return res.status(200).send("Authorization successful! Tokens acquired.");
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.message);
    res.status(500).send("Failed to exchange code for tokens.");
  }
};

