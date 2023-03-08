const { authMiddleware } = require('../auth/authMiddleware');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

 
router.post('/signup', userController.signup);

router.post('/login', userController.login)

router.get('/me', authMiddleware, userController.findOne);
 
router.get('/:id', authMiddleware, userController.allowIfLoggedin, userController.getUser);
 
router.get('/', authMiddleware, userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);
 
router.put('/:id', authMiddleware, userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);
 
router.delete('/:id', authMiddleware, userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);


module.exports = {router};



 
