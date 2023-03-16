const express = require('express');
const UserRouter = express.Router();
const userController = require('../controllers/userController');
// const authMiddleware = require('../auth/authMiddleware');
 
UserRouter.post('/', userController.signup);

UserRouter.get('/me',  userController.getOne);
 
UserRouter.get('/:userId', userController.allowIfLoggedin, userController.getUser);
 
UserRouter.get('/users', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);
 
UserRouter.put('/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);
 
UserRouter.delete('/:userId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);
 
module.exports = { UserRouter };
