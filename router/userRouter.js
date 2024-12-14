const express = require('express');
const { UserController } = require('../controllers')
const UserRouter = express.Router();
const { authMiddleware, IsAdmin } = require('../auth/authMiddleware');


UserRouter.get('/', UserController.findAll);

// UserRouter.get('/:id', UserController.findOne);
UserRouter.post('/', UserController.create);

UserRouter.post('/', IsAdmin ,UserController.create)

UserRouter.get('/email/:id', UserController.findOneEmail);

UserRouter.get('/name/:id', UserController.findOneName);

UserRouter.get('/id/:email', UserController.findOneId);

UserRouter.get('/', authMiddleware, UserController.findOne);

UserRouter.get('/me', authMiddleware, UserController.findOne);

UserRouter.delete('/:id', authMiddleware, UserController.delete);

// Route for users to update their own profile
UserRouter.put('/', authMiddleware, UserController.update);

// Route for admins to update other users' profiles
UserRouter.put('/:id', authMiddleware, UserController.update);


UserRouter.get('/trainers', UserController.getAllTrainers);


module.exports = { UserRouter };