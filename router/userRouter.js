const express = require('express');
const { UserController } = require('../controllers');
const UserRouter = express.Router();
const { authMiddleware, IsAdmin, requireVerified } = require('../auth/authMiddleware');




UserRouter.post('/', UserController.create); // Public signup route
UserRouter.get('/trainers', UserController.getAllTrainers); // Public route for fetching trainers
// OAuth2 callback

// Send verification email manually (optional)
UserRouter.post('/send-verification', UserController.sendVerificationEmail);

// Confirm email verification
UserRouter.get('/verify-email', UserController.verifyEmail);


// Specific route for the logged-in user
UserRouter.get('/me', authMiddleware, requireVerified, UserController.findOne);
   
// Fetch all users (Admin Only)
UserRouter.get('/', authMiddleware, IsAdmin, UserController.findAll);

// Specific routes to fetch user data by different criteria
UserRouter.get('/email/:id', authMiddleware, requireVerified, UserController.findOneEmail);
UserRouter.get('/name/:id', authMiddleware, requireVerified, UserController.findOneName);
UserRouter.get('/id/:email', authMiddleware, requireVerified, UserController.findOneEmail);


// Dynamic route for fetching a user by ID
UserRouter.get('/:id', authMiddleware, requireVerified, UserController.findOneId);

// Create a new user (Admin Only)
UserRouter.post('/', authMiddleware, IsAdmin, UserController.create);


// Delete a user (Admin Only)
UserRouter.delete('/:id', authMiddleware, IsAdmin, UserController.delete);

// Route for users to update their own profile
UserRouter.put('/', authMiddleware, requireVerified, UserController.update);

// Route for admins to update other users' profiles
UserRouter.put('/:id', authMiddleware, IsAdmin, UserController.update);

// Add session note
UserRouter.post('/:id/session-notes', authMiddleware, requireVerified, UserController.addSessionNote);

// Get session notes
UserRouter.get('/:id/session-notes', authMiddleware, requireVerified, UserController.getSessionNotes);

// Fetch and update user preferences
UserRouter.get('/:id/user-preferences', authMiddleware, requireVerified, UserController.getUserPreferences);
UserRouter.post('/:id/user-preferences', authMiddleware, requireVerified, UserController.addUserPreference);

// Add and fetch medical history
UserRouter.post('/:id/medical-history', authMiddleware, requireVerified, UserController.addMedicalHistory);
UserRouter.get('/:id/medical-history', authMiddleware, requireVerified, UserController.getMedicalHistory);

module.exports = { UserRouter };