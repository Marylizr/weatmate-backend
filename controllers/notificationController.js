const Notification = require("../models/notificationModel");

const toObjectIdString = (value) => {
  if (!value) return "";
  return String(value);
};

const buildVisibilityQuery = (user) => {
  const userId = user?._id;
  const role = user?.role;

  const or = [];

  // User-specific notifications
  or.push({ recipientType: "user", recipientUserId: userId });

  // Role-based notifications
  if (role) {
    or.push({ recipientType: "role", recipientRole: role });
  }

  // Multi-recipient notifications
  or.push({ recipientType: "many", recipientUserIds: userId });

  return { $or: or };
};

const isUnreadForUser = (notification, userId) => {
  const idStr = toObjectIdString(userId);
  const readBy = Array.isArray(notification.readBy) ? notification.readBy : [];
  const readByStrs = readBy.map(toObjectIdString);
  return !readByStrs.includes(idStr);
};

exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 10, page = 1, archived = "false" } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const baseQuery = buildVisibilityQuery(user);
    const archiveFilter =
      String(archived) === "true" ? {} : { isArchived: { $ne: true } };

    const query = { ...baseQuery, ...archiveFilter };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const userId = user?._id;

    const normalized = notifications.map((n) => ({
      ...n,
      isRead: !isUnreadForUser(n, userId),
    }));

    res.json({ results: normalized, page: safePage, limit: safeLimit });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    const userId = user?._id;

    const baseQuery = buildVisibilityQuery(user);
    const query = { ...baseQuery, isArchived: { $ne: true } };

    const notifications = await Notification.find(query)
      .select("readBy")
      .lean();

    const unread = notifications.reduce((acc, n) => {
      return acc + (isUnreadForUser(n, userId) ? 1 : 0);
    }, 0);

    res.json({ unread });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ message: "Error fetching unread count" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const user = req.user;
    const userId = user?._id;
    const { id } = req.params;

    const baseQuery = buildVisibilityQuery(user);
    const query = { _id: id, ...baseQuery };

    const updated = await Notification.findOneAndUpdate(
      query,
      { $addToSet: { readBy: userId } },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ ...updated, isRead: true });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

exports.readAll = async (req, res) => {
  try {
    const user = req.user;
    const userId = user?._id;

    const baseQuery = buildVisibilityQuery(user);
    const query = { ...baseQuery, isArchived: { $ne: true } };

    await Notification.updateMany(query, { $addToSet: { readBy: userId } });

    res.json({ ok: true });
  } catch (err) {
    console.error("readAll error:", err);
    res.status(500).json({ message: "Error marking all as read" });
  }
};

exports.createNotification = async (payload) => {
  return Notification.create(payload);
};
