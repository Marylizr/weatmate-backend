const express = require('express');
const { UserController } = require('../controllers')
const UserRouter = express.Router();
const { authMiddleware, IsAdmin } = require('../auth/authMiddleware');





UserRouter.get('/me', authMiddleware, UserController.findOne);           // Specific route for the logged-in user

UserRouter.get('/', UserController.findAll);

UserRouter.get('/email/:id', UserController.findOneEmail);

UserRouter.get('/name/:id', UserController.findOneName);

UserRouter.get('/id/:email', UserController.findOneId);

UserRouter.get('/trainers', authMiddleware, UserController.getAllTrainers); // Specific route for fetching trainers

UserRouter.get('/:id', authMiddleware, UserController.findOneId);          // Dynamic route for fetching a user by ID

UserRouter.post('/', authMiddleware, IsAdmin, UserController.create);

UserRouter.post('/', UserController.create);


UserRouter.delete('/:id', IsAdmin, authMiddleware, UserController.delete);

// Route for users to update their own profile
UserRouter.put('/', authMiddleware, UserController.update);

// Route for admins to update other users' profiles
UserRouter.put('/:id', authMiddleware, IsAdmin, UserController.update);

// UserRouter.post('/:id/session-notes', authMiddleware, UserController.addOrUpdateSessionNotes);


// Add session note
UserRouter.post('/:id/session-notes', UserController.addSessionNote);

// Get session notes
UserRouter.get('/:id/session-notes', UserController.getSessionNotes);

UserRouter.get('/:id/user-preferences', UserController.getUserPreferences);

UserRouter.post('/:id/user-preferences', authMiddleware, UserController.addUserPreference);

// Route to add a medical history entry
UserRouter.post('/:id/medical-history', UserController.addMedicalHistory);

// Route to fetch medical history
UserRouter.get('/:id/medical-history', UserController.getMedicalHistory);


module.exports = { UserRouter };