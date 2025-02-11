const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');
const { authMiddleware } = require('../auth/authMiddleware');

// Public route for login
router.post('/login', login);

// Protected route to get user details after login
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    id: req.user._id,
    role: req.user.role,
    name: req.user.name,
    gender: req.user.gender,
    message: 'User authenticated successfully'
  });
});

module.exports = router;