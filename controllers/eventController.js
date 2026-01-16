// backend/controllers/eventController.js
const Event = require("../models/eventModel");
const User = require("../models/userModel");
const sendEmail = require("../sendVerificationEmail");

// Roles en TU modelo:
// enum: ["basic", "admin", "personal-trainer"]

const USER_POPULATE_FIELDS = "name email image role fitness_level trainerId";
const TRAINER_POPULATE_FIELDS = "name email image role";

const populateEvent = (query) =>
  query
    .populate("userId", USER_POPULATE_FIELDS)
    .populate("trainerId", TRAINER_POPULATE_FIELDS);

const isAdmin = (req) => req.user?.role === "admin";
const isTrainer = (req) => req.user?.role === "personal-trainer";
const isBasic = (req) => req.user?.role === "basic";

const toIdArray = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return [];
};

const ensureValidFutureDate = (dateValue) => {
  const start = new Date(dateValue);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, status: 400, message: "Invalid date." };
  }
  if (start.getTime() < Date.now()) {
    return {
      ok: false,
      status: 400,
      message: "You cannot create events in the past.",
    };
  }
  return { ok: true, start };
};

const trainerOwnsUsersOr403 = async (trainerId, usersToAssign, res) => {
  // If no users, nothing to validate
  if (!usersToAssign || usersToAssign.length === 0) return true;

  const invalidCount = await User.countDocuments({
    _id: { $in: usersToAssign },
    trainerId: { $ne: trainerId },
  });

  if (invalidCount > 0) {
    res.status(403).json({
      message: "One or more selected users do not belong to this trainer.",
    });
    return false;
  }

  return true;
};

// GET /events
// Admin: all events (optionally filter by userId query)
// Trainer: only events created by this trainer (trainerId)
// Basic: only events assigned to this user
exports.findAll = async (req, res) => {
  try {
    let query = {};

    // optional filter by userId (used sometimes by UI)
    const filterUserId = req.query.userId;

    if (isAdmin(req)) {
      query = filterUserId ? { userId: filterUserId } : {};
    } else if (isTrainer(req)) {
      query = { trainerId: req.user._id };
      if (filterUserId) query.userId = filterUserId;
    } else {
      // basic user
      query = { userId: req.user._id };
    }

    const events = await populateEvent(Event.find(query)).sort({ date: 1 });
    return res.status(200).json(events);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to retrieve events", error: error.message });
  }
};

// GET /events/:id
exports.findOne = async (req, res) => {
  try {
    const event = await populateEvent(Event.findById(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization:
    // admin ok
    // trainer: must own event
    // basic: must be assigned
    if (!isAdmin(req)) {
      if (
        isTrainer(req) &&
        String(event.trainerId?._id) !== String(req.user._id)
      ) {
        return res.status(403).json({ message: "Access denied." });
      }
      if (isBasic(req)) {
        const assigned = (event.userId || []).some(
          (u) => String(u._id) === String(req.user._id)
        );
        if (!assigned)
          return res.status(403).json({ message: "Access denied." });
      }
    }

    return res.status(200).json(event);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to find event", error: error.message });
  }
};

// GET /events/user/:userId  (ClientList needs this)
// Admin: any userId
// Trainer: only if that user belongs to trainer
// Basic: only if userId is self
exports.getUserEventsByUserId = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (isBasic(req) && String(targetUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (isTrainer(req)) {
      const target = await User.findById(targetUserId).select("trainerId");
      if (!target) return res.status(404).json({ message: "User not found" });

      if (String(target.trainerId) !== String(req.user._id)) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    const events = await populateEvent(
      Event.find({ userId: targetUserId })
    ).sort({ date: 1 });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user events.",
      error: error.message,
    });
  }
};

// POST /events
exports.create = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Accept both frontend payload styles:
    // - selectedUsers (new)
    // - userId (existing in your project)
    // - users (fallback)
    let selectedUsers =
      req.body.selectedUsers ?? req.body.userId ?? req.body.users ?? [];
    selectedUsers = toIdArray(selectedUsers);

    const {
      eventType,
      title,
      date,
      time, // optional if frontend sends combined datetime in `date`
      duration,
      trainerOnly = false,
      location,
      description,
      customerEmail,
      selectAllUsers = false, // optional_toggle if you add it in UI
    } = req.body;

    // required fields
    if (!eventType || !title || !date || !duration) {
      return res
        .status(400)
        .json({ message: "Missing required event details." });
    }

    // Build start date
    // If `date` is already an ISO datetime: fine.
    // If UI sends date + time separately, combine.
    let startDateValue = date;
    if (time && typeof date === "string" && !date.includes("T")) {
      startDateValue = `${date}T${time}`;
    }

    const check = ensureValidFutureDate(startDateValue);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

    const trainerId = req.user._id;

    // Decide assigned users
    let assignedUsers = [];

    if (!trainerOnly) {
      if (selectAllUsers) {
        // admin => all basics
        // trainer => only their basics
        if (isAdmin(req)) {
          const allBasics = await User.find({ role: "basic" }).select("_id");
          assignedUsers = allBasics.map((u) => String(u._id));
        } else if (isTrainer(req)) {
          const myBasics = await User.find({
            role: "basic",
            trainerId: trainerId,
          }).select("_id");
          assignedUsers = myBasics.map((u) => String(u._id));
        }
      } else {
        assignedUsers = selectedUsers;
      }

      // Trainer authorization: all assigned users must belong to them
      if (isTrainer(req)) {
        const ok = await trainerOwnsUsersOr403(trainerId, assignedUsers, res);
        if (!ok) return;
      }
    }

    // Sanitize enums so they NEVER break your schema
    // status enum: ["pending","completed","canceled"]
    const safeStatus = ["pending", "completed", "canceled"].includes(
      req.body.status
    )
      ? req.body.status
      : "pending";

    // confirmationStatus enum: ["not_sent","sent","confirmed"]
    // NEVER accept "pending" here (that caused your error)
    const safeConfirmationStatus = ["not_sent", "sent", "confirmed"].includes(
      req.body.confirmationStatus
    )
      ? req.body.confirmationStatus
      : "not_sent";

    const event = await Event.create({
      eventType,
      title,
      date: check.start,
      duration: Number(duration),
      trainerId,
      userId: trainerOnly ? [] : assignedUsers,
      trainerOnly: !!trainerOnly,
      location,
      description,
      customerEmail,
      status: safeStatus,
      confirmationStatus: safeConfirmationStatus,
      rescheduleHistory: Array.isArray(req.body.rescheduleHistory)
        ? req.body.rescheduleHistory
        : [],
    });

    const populated = await populateEvent(Event.findById(event._id));

    return res.status(201).json({
      message: "Event created successfully.",
      event: populated,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res
      .status(500)
      .json({ message: "Could not create event.", error: error.message });
  }
};

// PUT/PATCH /events/:id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // trainer can only update own events
    if (isTrainer(req) && String(event.trainerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    // prevent breaking enums accidentally
    if (
      req.body.confirmationStatus &&
      !["not_sent", "sent", "confirmed"].includes(req.body.confirmationStatus)
    ) {
      delete req.body.confirmationStatus;
    }

    if (
      req.body.status &&
      !["pending", "completed", "canceled"].includes(req.body.status)
    ) {
      delete req.body.status;
    }

    const updated = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    const populated = await populateEvent(Event.findById(updated._id));
    return res
      .status(200)
      .json({ message: "Event updated successfully", event: populated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to update event", error: error.message });
  }
};

// DELETE /events/:id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // trainer can only delete own events
    if (isTrainer(req) && String(event.trainerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    await Event.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to delete event", error: error.message });
  }
};

// PUT /events/:id/reschedule
exports.rescheduleEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // trainer can only reschedule own events
    if (isTrainer(req) && String(event.trainerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const check = ensureValidFutureDate(newDate);
    if (!check.ok)
      return res.status(check.status).json({ message: check.message });

    event.rescheduleHistory.push({ previousDate: event.date });
    event.date = check.start;

    await event.save();

    const populated = await populateEvent(Event.findById(event._id));
    return res
      .status(200)
      .json({ message: "Event rescheduled successfully", event: populated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to reschedule event", error: error.message });
  }
};

// PUT /events/:id/status
exports.updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // trainer can only update status of own events
    if (isTrainer(req) && String(event.trainerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    event.status = status;
    await event.save();

    const populated = await populateEvent(Event.findById(event._id));
    return res
      .status(200)
      .json({ message: `Event status updated to ${status}`, event: populated });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update event status",
      error: error.message,
    });
  }
};

// POST /events/:id/confirm
// body optional: { action: "confirm" | "decline" }
// default action = "confirm"
exports.confirmEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body?.action === "decline" ? "decline" : "confirm";

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization:
    // admin ok
    // trainer owner ok
    // assigned user ok
    const isOwnerTrainer =
      isTrainer(req) && String(event.trainerId) === String(req.user._id);

    const isAssignedUser = (event.userId || []).some(
      (u) => String(u) === String(req.user._id)
    );

    if (!isAdmin(req) && !isOwnerTrainer && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied." });
    }

    // update sets
    if (action === "confirm") {
      await Event.findByIdAndUpdate(
        id,
        {
          $addToSet: { confirmedUsers: req.user._id },
          $pull: { declinedUsers: req.user._id },
          confirmationStatus: "confirmed",
        },
        { new: true }
      );
    } else {
      await Event.findByIdAndUpdate(
        id,
        {
          $addToSet: { declinedUsers: req.user._id },
          $pull: { confirmedUsers: req.user._id },
        },
        { new: true }
      );
    }

    const updated = await populateEvent(Event.findById(id));
    return res
      .status(200)
      .json({ message: `Event ${action}ed.`, event: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating confirmation.", error: error.message });
  }
};

// POST /events/notify
exports.sendEventNotifications = async (req, res) => {
  try {
    // Only pending events, not notified
    const events = await populateEvent(
      Event.find({ status: "pending", notificationSent: false })
    );

    // userId is array => loop users
    for (const ev of events) {
      const users = Array.isArray(ev.userId) ? ev.userId : [];
      for (const u of users) {
        if (u?.email) {
          // keep your current email sender
          await sendEmail(
            u.email,
            "Upcoming Event",
            `You have an event: ${ev.title}`
          );
        }
      }

      ev.notificationSent = true;
      await ev.save();
    }

    return res
      .status(200)
      .json({ message: "Notifications sent successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Error sending notifications.",
      error: error.message,
    });
  }
};
