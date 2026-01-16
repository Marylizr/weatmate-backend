// backend/router/eventRouter.js
const express = require("express");
const eventRouter = express.Router();

const eventController = require("../controllers/eventController");
const { authMiddleware, requireVerified } = require("../auth/authMiddleware");
const { allowRoles } = require("../auth/allowRoles");

// ORDER IMPORTANTE:
// rutas específicas primero, luego /:id

// List events (scoped by role inside controller)
eventRouter.get("/", authMiddleware, eventController.findAll);

// Get events for a specific user (used by ClientList)
eventRouter.get(
  "/user/:userId",
  authMiddleware,
  eventController.getUserEventsByUserId
);

// Create event (admin or personal-trainer)
eventRouter.post(
  "/",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.create
);

// Send notifications (admin or personal-trainer)
eventRouter.post(
  "/notify",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.sendEventNotifications
);

// Get single event
eventRouter.get("/:id", authMiddleware, eventController.findOne);

// Delete event
eventRouter.delete(
  "/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.delete
);

// Update event
eventRouter.put(
  "/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.update
);

eventRouter.patch(
  "/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.update
);

// Reschedule
eventRouter.put(
  "/:id/reschedule",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.rescheduleEvent
);

// Update status (completed/canceled/pending)
eventRouter.put(
  "/:id/status",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  eventController.updateEventStatus
);

// Confirm/Decline (assigned user OR event owner/admin)
eventRouter.post("/:id/confirm", authMiddleware, eventController.confirmEvent);

module.exports = { eventRouter };
