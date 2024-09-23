const express = require('express');
<<<<<<< HEAD
const LoginRouter = express.Router();
const userController = require('../controllers/userController');

LoginRouter.post('/login', userController.login);

module.exports =  LoginRouter ;
=======
const  LoginController  = require('../controllers/loginController');


const loginRouter = express.Router();

loginRouter.post('/login', LoginController.login);

module.exports = loginRouter;

>>>>>>> original
