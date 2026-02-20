const express = require("express");
const eventController = require("../controllers/eventController");
const { authMiddleware } = require("../auth/authMiddleware");
const allowRoles = require("../auth/allowRoles");

const eventRouter = express.Router();

/*
  IMPORTANT:
  Put static routes BEFORE '/:id' routes to avoid collisions.
*/

/* -------------------------
   Notifications / Utilities
-------------------------- */

// Send email notifications for upcoming events (Admin/Trainer only)
eventRouter.post(
  "/notify",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.sendEventNotifications,
);

/* -------------------------
   Core CRUD
-------------------------- */

// Get all events (Authenticated users)
// Supports query: ?userId=... or ?trainerId=...
eventRouter.get("/", authMiddleware, eventController.findAll);

// Create a new event (Admin/Trainer)
eventRouter.post(
  "/",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.create,
);

/* -------------------------
   User-specific helpers
-------------------------- */

// Get events assigned to logged user + unreadCount
eventRouter.get(
  "/user",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  eventController.getUserEvents,
);

/* -------------------------
   Invite responses (User)
-------------------------- */

// Accept invite (adds to confirmedUsers)
eventRouter.post(
  "/:id/confirm",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  eventController.confirmEvent,
);

// Decline invite (adds to declinedUsers)
eventRouter.post(
  "/:id/decline",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  eventController.declineEvent,
);

/* -------------------------
   Reschedule request flow
-------------------------- */

// Client requests a new date/time
eventRouter.post(
  "/:id/reschedule-request",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  eventController.requestReschedule,
);

// Trainer accepts proposed date/time
eventRouter.post(
  "/:id/reschedule-accept",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.acceptReschedule,
);

// Trainer rejects request
eventRouter.post(
  "/:id/reschedule-reject",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.rejectReschedule,
);

/* -------------------------
   Legacy / direct actions
-------------------------- */

// Direct reschedule (Trainer/Admin) preserving history
eventRouter.put(
  "/:id/reschedule",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.rescheduleEvent,
);

// Email confirmation flow (if you still use customerEmail confirmations)
eventRouter.post(
  "/:id/email-confirm",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.confirmEventEmail,
);

// Update status (pending/completed/canceled)
eventRouter.put(
  "/:id/status",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.updateEventStatus,
);

/* -------------------------
   Single event CRUD by id
-------------------------- */

eventRouter.get("/:id", authMiddleware, eventController.findOne);

eventRouter.put(
  "/:id",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.update,
);

eventRouter.patch(
  "/:id",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.update,
);

eventRouter.delete(
  "/:id",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  eventController.delete,
);

module.exports = { eventRouter };
