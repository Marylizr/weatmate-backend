const { authMiddleware } = require('../auth/authMiddleware');
const express = require('express');
const UserRouter = express.Router();
const userController = require('../controllers/userController');

 
UserRouter.post('/', userController.create);

UserRouter.post('/login', userController.login);

UserRouter.get('/',  userController.findAll);

UserRouter.get('/me',  userController.findOne);

UserRouter.patch('/', authMiddleware, userController.update);

UserRouter.put('/',authMiddleware, userController.update);

UserRouter.delete('/id', authMiddleware, userController.delete);
 
// router.get('/:id',  userController.allowIfLoggedin, userController.getUser);
 
// router.get('/',  userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);
 
// router.put('/:id', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);
 
// router.delete('/:id', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);


module.exports = {UserRouter};



 
