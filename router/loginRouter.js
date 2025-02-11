const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');


// Public route for login
router.post('/login', login);



module.exports = router;