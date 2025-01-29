const express = require('express');
const FavController = require('../controllers/favController');
const FavRouter = express.Router();

// Define routes for the FavRouter
FavRouter.get('/', FavController.findAll); // Fetch all saved workouts
FavRouter.get('/:id', FavController.findOne); // Fetch a specific saved workout by ID
FavRouter.post('/', FavController.create); // Create a new saved workout
FavRouter.put('/:id', FavController.update); // Update a saved workout (replace entire resource)
FavRouter.delete('/:id', FavController.delete); // Delete a specific saved workout

module.exports = FavRouter;
