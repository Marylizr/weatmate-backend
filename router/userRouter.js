const express = require('express');
const userController = require('../controllers/usercontroller'); 
const userRouter = express.Router();
const { authMiddleware, IsAdmin, requireVerified } = require('../auth/authMiddleware');


// Specific route for the logged-in user
userRouter.get('/me', authMiddleware, requireVerified, userController.findOne);

// Create a new user (Admin Only)
userRouter.post('/', authMiddleware, IsAdmin, userController.createUserByAdmin);

userRouter.post('/create-profile', userController.create); // Public signup route

userRouter.get('/trainers', userController.getAllTrainers); // Public route for fetching trainers
// OAuth2 callback

// Send verification email manually (optional)
userRouter.post('/send-verification', userController.sendVerificationEmail);

// Confirm email verification
userRouter.get('/verify-email', userController.verifyEmail);



   
// Fetch all users (Admin Only)
userRouter.get('/', authMiddleware, IsAdmin, userController.findAll);

// Specific routes to fetch user data by different criteria
userRouter.get('/email/:id', authMiddleware, requireVerified, userController.findOneEmail);
userRouter.get('/name/:id', authMiddleware, requireVerified, userController.findOneName);
userRouter.get('/id/:email', authMiddleware, requireVerified, userController.findOneEmail);


// Dynamic route for fetching a user by ID
userRouter.get('/:id', authMiddleware, requireVerified, userController.findOneId);



// Delete a user (Admin Only)
userRouter.delete('/:id', authMiddleware, IsAdmin, userController.delete);

// Route for users to update their own profile
userRouter.put('/', authMiddleware, requireVerified, userController.update);

// Route for admins to update other users' profiles
userRouter.put('/:id', authMiddleware, IsAdmin, userController.update);

// Add session note
userRouter.post('/:id/session-notes', authMiddleware, requireVerified, userController.addSessionNote);

// Get session notes
userRouter.get('/:id/session-notes', authMiddleware, requireVerified, userController.getSessionNotes);

// Fetch and update user preferences
userRouter.get('/:id/user-preferences', authMiddleware, requireVerified, userController.getUserPreferences);
userRouter.post('/:id/user-preferences', authMiddleware, requireVerified, userController.addUserPreference);

// Add and fetch medical history
userRouter.post('/:id/medical-history', authMiddleware, requireVerified, userController.addMedicalHistory);
userRouter.get('/:id/medical-history', authMiddleware, requireVerified, userController.getMedicalHistory);

module.exports =  userRouter ;


