
const express = require('express');
const verifyEmailController = require('../controllers/verifyEmailController');
const router = express.Router();


router.get('/oauth2callback', verifyEmailController.oauth2callback);


module.exports = router;
