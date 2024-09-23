const express = require('express');
const  LoginController  = require('../controllers/loginController');


const loginRouter = express.Router();

loginRouter.post('/login', LoginController.login);

module.exports = loginRouter;

