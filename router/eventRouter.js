const express = require('express');
const EventController = require('../controllers/EventController');
const authenticateTrainer = require('../auth/authenticateTrainer'); // Import the middleware
const EventRouter = express.Router();

// Get all events (this might not need authentication depending on your requirements)
EventRouter.get('/', EventController.findAll);

// Get one event by ID
EventRouter.get('/:id', EventController.findOne);

// Create a new event (only accessible to authenticated trainers)
EventRouter.post('/', authenticateTrainer, EventController.create);

// Delete an event by ID (only accessible to authenticated trainers)
EventRouter.delete('/:id', authenticateTrainer, EventController.delete);

// Update an event by ID (only accessible to authenticated trainers)
EventRouter.put('/:id', authenticateTrainer, EventController.update);

// Update an event partially by ID (only accessible to authenticated trainers)
EventRouter.patch('/:id', authenticateTrainer, EventController.update);

module.exports = { EventRouter };
