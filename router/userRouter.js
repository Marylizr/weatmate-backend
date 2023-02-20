const express = require('express');
const  UserController  = require('../controllers/usercontroler');
const UserRouter = express.Router();
const { authMiddleware } = require('../auth/authMiddleware');
const {body} = require("express-validator");


UserRouter.get('/', authMiddleware, UserController.findAll);

UserRouter.get('/:id', authMiddleware, UserController.findOne);

UserRouter.post('/', body("email", "Email must be a valid email.").isEmail(), UserController.create)

UserRouter.get('/me', authMiddleware, UserController.findOneName);

UserRouter.delete('/:id', authMiddleware, UserController.delete);

UserRouter.patch('/', authMiddleware, UserController.update);

UserRouter.put('/', authMiddleware, UserController.update);


module.exports = { UserRouter };