const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  readAll,
} = require("../controllers/notificationController");

// Adjust these imports to match your project structure
const { authMiddleware } = require("../auth/authMiddleware");
const allowRoles = require("../auth/allowRoles");

router.get(
  "/",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  getNotifications,
);

router.get(
  "/unread-count",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  getUnreadCount,
);

router.patch(
  "/:id/read",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  markAsRead,
);

router.post(
  "/read-all",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  readAll,
);

module.exports = router;
