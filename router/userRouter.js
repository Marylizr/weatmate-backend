const express = require('express');
const { UserController } = require('../controllers')
const UserRouter = express.Router();
const { authMiddleware } = require('../auth/authMiddleware');


UserRouter.get('/', UserController.findAll);

// UserRouter.get('/:id', UserController.findOne);

UserRouter.post('/', UserController.create)

UserRouter.get('/email/:id', UserController.findOneEmail);

UserRouter.get('/name/:id', UserController.findOneName);

UserRouter.get('/id/:email', UserController.findOneId);

UserRouter.get('/', authMiddleware, UserController.findOne);

UserRouter.get('/me', authMiddleware, UserController.findOne);

UserRouter.delete('/:id', authMiddleware, UserController.delete);

UserRouter.patch('/:id', authMiddleware, UserController.update);

UserRouter.put('/:id',authMiddleware, UserController.update);


module.exports = { UserRouter };