const express = require('express');
const  loginController  = require('../controllers/loginController');


const LoginRouter = express.Router();

LoginRouter.post('/login', loginController);

module.exports = LoginRouter;