const express = require('express');
const verifyEmailController = require('../controllers/verifyEmailController');
const router = express.Router();

// OAuth2 Routes
router.get('/oauth2callback', verifyEmailController.oauth2callback);


module.exports = router;
