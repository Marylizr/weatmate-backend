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

// Confirm an event and send a confirmation email (only accessible to authenticated trainers)
EventRouter.put('/:id/confirm', authenticateTrainer, EventController.confirmEvent);

// Reschedule an event (only accessible to authenticated trainers)
EventRouter.put('/:id/reschedule', authenticateTrainer, EventController.rescheduleEvent);

// Update event status (custom route to mark as completed or canceled)
EventRouter.put('/:id/status', authenticateTrainer, EventController.updateEventStatus);

module.exports = { EventRouter };
