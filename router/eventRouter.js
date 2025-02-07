const express = require('express');
const eventController = require('../controllers/eventController');
const authenticateTrainer = require('../auth/authenticateTrainer'); // Import the middleware
const eventRouter = express.Router();

// Get all events (this might not need authentication depending on your requirements)
eventRouter.get('/', eventController.findAll);

// Get one event by ID
eventRouter.get('/:id', eventController.findOne);

// Create a new event (only accessible to authenticated trainers)
eventRouter.post('/', authenticateTrainer, eventController.create);

// Delete an event by ID (only accessible to authenticated trainers)
eventRouter.delete('/:id', authenticateTrainer, eventController.delete);

// Update an event by ID (only accessible to authenticated trainers)
eventRouter.put('/:id', authenticateTrainer, eventController.update);

// Update an event partially by ID (only accessible to authenticated trainers)
eventRouter.patch('/:id', authenticateTrainer, eventController.update);

// Confirm an event and send a confirmation email (only accessible to authenticated trainers)
eventRouter.put('/:id/confirm', authenticateTrainer, eventController.confirmEvent);

// Reschedule an event (only accessible to authenticated trainers)
eventRouter.put('/:id/reschedule', authenticateTrainer, eventController.rescheduleEvent);

// Update event status (custom route to mark as completed or canceled)
eventRouter.put('/:id/status', authenticateTrainer, eventController.updateEventStatus);

module.exports = { eventRouter };
