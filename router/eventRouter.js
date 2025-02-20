const express = require('express');
const eventController = require('../controllers/eventController');
const authenticateTrainer = require('../auth/authenticateTrainer'); // Middleware for trainers
const { authMiddleware } = require('../auth/authMiddleware'); // General authentication
const eventRouter = express.Router();

//  Get all events (Accessible to authenticated users)
eventRouter.get('/', authMiddleware, eventController.findAll);

//  Get a single event by ID
eventRouter.get('/:id', authMiddleware, eventController.findOne);

// Create a new event (Only accessible to authenticated trainers)
eventRouter.post('/', authenticateTrainer, authMiddleware, eventController.create);

//  Delete an event by ID (Only accessible to authenticated trainers)
eventRouter.delete('/:id', authenticateTrainer, eventController.delete);

//  Update an event by ID (Only accessible to authenticated trainers)
eventRouter.put('/:id', authenticateTrainer, eventController.update);

//  Update an event partially by ID (Only accessible to authenticated trainers)
eventRouter.patch('/:id', authenticateTrainer, eventController.update);

//  Confirm or Decline an Event (Accessible to assigned users)
eventRouter.post('/:id/confirm', authMiddleware, eventController.confirmEvent);

//  Reschedule an event (Only accessible to authenticated trainers)
eventRouter.put('/:id/reschedule', authenticateTrainer, eventController.rescheduleEvent);

//  Update event status (Mark as completed or canceled) (Trainers only)
eventRouter.put('/:id/status', authenticateTrainer, eventController.updateEventStatus);

// Send notifications for upcoming events (Trainers/Admins only)
eventRouter.post('/notify', authenticateTrainer, eventController.sendEventNotifications);

module.exports = { eventRouter };
