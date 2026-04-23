const Notification = require("../models/notificationModel");

// -----------------------------
// HELPERS
// -----------------------------
const toObjectIdString = (value) => {
  if (!value) return "";
  return String(value);
};

const buildVisibilityQuery = (user) => {
  const userId = user?._id;
  const role = user?.role;

  const or = [];

  or.push({ recipientType: "user", recipientUserId: userId });

  if (role) {
    or.push({ recipientType: "role", recipientRole: role });
  }

  or.push({ recipientType: "many", recipientUserIds: userId });

  return { $or: or };
};

const isUnreadForUser = (notification, userId) => {
  const idStr = toObjectIdString(userId);
  const readBy = Array.isArray(notification.readBy) ? notification.readBy : [];
  const readByStrs = readBy.map(toObjectIdString);
  return !readByStrs.includes(idStr);
};

// -----------------------------
// GET NOTIFICATIONS
// -----------------------------
exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;

    const notifications = await Notification.find(buildVisibilityQuery(user))
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const normalized = notifications.map((n) => ({
      ...n,
      isRead: !isUnreadForUser(n, user._id),
    }));

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// -----------------------------
// UNREAD COUNT
// -----------------------------
exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;

    const notifications = await Notification.find(
      buildVisibilityQuery(user),
    ).lean();

    const unread = notifications.filter((n) =>
      isUnreadForUser(n, user._id),
    ).length;

    res.json({ unread });
  } catch (err) {
    res.status(500).json({ message: "Error fetching unread count" });
  }
};

// -----------------------------
// MARK AS READ
// -----------------------------
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } },
      { new: true },
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error marking as read" });
  }
};

// -----------------------------
// READ ALL
// -----------------------------
exports.readAll = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({}, { $addToSet: { readBy: userId } });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error marking all as read" });
  }
};

// -----------------------------
// CREATE (INTERNAL USE)
// -----------------------------
exports.createNotification = async (payload) => {
  return Notification.create(payload);
};


// -----------------------------
// CREATE MOOD RISK ALERT
// -----------------------------
exports.createMoodRiskAlert = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { moods } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Array.isArray(moods) || moods.length < 3) {
      return res.status(400).json({ message: "Invalid moods data" });
    }

    const lastAlert = await Notification.findOne({
      userId,
      type: "mood-risk",
    }).sort({ createdAt: -1 });

    // evitar duplicados en corto tiempo
    if (lastAlert) {
      const diff = Date.now() - new Date(lastAlert.createdAt).getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (diff < ONE_DAY) {
        return res.status(200).json({ message: "Alert already exists" });
      }
    }

    const notification = await Notification.create({
      userId,
      type: "mood-risk",
      title: "Recovery risk detected",
      message:
        "Multiple negative mood logs detected. Recommend recovery and lower load.",
      data: { moods },
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error("createMoodRiskAlert error:", error);
    return res.status(500).json({
      message: "Error creating alert",
      error: error.message,
    });
  }
};