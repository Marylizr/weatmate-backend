// emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service provider (e.g., Gmail, Outlook, etc.)
  auth: {
    user: 'your-email@gmail.com', // Your email
    pass: 'your-email-password',  // Your email password or app password
  },
});

const sendEmail = async (recipientEmail, subject, text) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: recipientEmail,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
