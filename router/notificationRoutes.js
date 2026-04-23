const express = require("express");
const notificationRouter = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  readAll,
  createMoodRiskAlert,
} = require("../controllers/notificationController");

const { authMiddleware } = require("../auth/authMiddleware");
const allowRoles = require("../auth/allowRoles");

// ==============================
// GET ALL NOTIFICATIONS (paginated)
// ==============================
notificationRouter.get(
  "/",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  getNotifications,
);

// ==============================
// GET UNREAD COUNT
// ==============================
notificationRouter.get(
  "/unread-count",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  getUnreadCount,
);

// ==============================
// MARK ONE AS READ
// ==============================
notificationRouter.patch(
  "/:id/read",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  markAsRead,
);

// ==============================
// MARK ALL AS READ
// ==============================
notificationRouter.post(
  "/read-all",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  readAll,
);

notificationRouter.post(
  "/notifications/mood-risk",
  authMiddleware,
  createMoodRiskAlert,
);

module.exports = notificationRouter;
