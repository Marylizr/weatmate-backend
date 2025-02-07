const express = require('express');
const favController = require('../controllers/favController');
const favRouter = express.Router();

// Define routes for the FavRouter
favRouter.get('/', favController.findAll); // Fetch all saved workouts
favRouter.get('/:id', favController.findOne); // Fetch a specific saved workout by ID
favRouter.post('/', favController.create); // Create a new saved workout
favRouter.put('/:id', favController.update); // Update a saved workout (replace entire resource)
favRouter.delete('/:id', favController.delete); // Delete a specific saved workout

module.exports = favRouter;
