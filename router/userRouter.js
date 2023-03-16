const express = require('express');
const { UserController } = require('../controllers')
const UserRouter = express.Router();
const { authMiddleware } = require('../auth/authMiddleware');


UserRouter.get('/', UserController.findAll);

// UserRouter.get('/:id', UserController.findOne);

UserRouter.post('/', UserController.create)

UserRouter.get('/', authMiddleware, UserController.findOne);

UserRouter.get('/me', authMiddleware, UserController.findOne);

UserRouter.delete('/:id', authMiddleware, UserController.delete);

UserRouter.patch('/', authMiddleware, UserController.update);

UserRouter.put('/',authMiddleware, UserController.update);


module.exports = { UserRouter };