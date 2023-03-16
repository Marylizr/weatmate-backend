const express = require('express');
const LoginRouter = express.Router();
const userController = require('../controllers/userController');

LoginRouter.post('/login', userController.login);

module.exports =  LoginRouter ;