const mongoose = require("mongoose");
const Event = require("../models/eventModel");
const User = require("../models/userModel");
const sendEmail = require("../sendVerificationEmail");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const uniqObjectIds = (arr = []) => {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const s = String(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(v);
  }
  return out;
};

const safeDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const ensureAuthUser = (req, res) => {
  const id = req?.user?.id || req?.user?._id;
  if (!id) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return String(id);
};

const basePopulate = (q) =>
  q
    .populate(
      "userId",
      "name email role picture profilePicture avatar image photo",
    )
    .populate(
      "trainerId",
      "name email role picture profilePicture avatar image photo",
    );

const computeInviteStateForUser = (event, userId) => {
  const uid = String(userId);
  const assigned = Array.isArray(event.userId)
    ? event.userId.some((x) => String(x) === uid)
    : false;

  const confirmed = Array.isArray(event.confirmedUsers)
    ? event.confirmedUsers.some((x) => String(x) === uid)
    : false;

  const declined = Array.isArray(event.declinedUsers)
    ? event.declinedUsers.some((x) => String(x) === uid)
    : false;

  if (!assigned) return "not_assigned";
  if (confirmed) return "confirmed";
  if (declined) return "declined";
  return "pending";
};

exports.findAll = async (req, res) => {
  try {
    const query = {};

    // Optional filters
    if (req.query.userId && isValidObjectId(req.query.userId)) {
      query.userId = toObjectId(req.query.userId);
    }
    if (req.query.trainerId && isValidObjectId(req.query.trainerId)) {
      query.trainerId = toObjectId(req.query.trainerId);
    }

    // Optional: status filter
    if (
      req.query.status &&
      ["pending", "completed", "canceled"].includes(req.query.status)
    ) {
      query.status = req.query.status;
    }

    const events = await basePopulate(Event.find(query).sort({ date: 1 }));

    res.status(200).json(events);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to retrieve events", error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await basePopulate(Event.findById(eventId));
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json(event);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to find event", error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const {
      eventType,
      title,
      date,
      duration,
      trainerOnly,
      userId,
      location,
      description,
      customerEmail,
    } = req.body;

    if (!eventType || !title || !date || !duration) {
      return res
        .status(400)
        .json({ message: "Missing required event details." });
    }

    const parsedDate = safeDate(date);
    if (!parsedDate) return res.status(400).json({ message: "Invalid date." });

    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return res.status(400).json({ message: "Invalid duration." });
    }

    // Assigned users
    let assignedUsers = [];
    if (!trainerOnly) {
      if (Array.isArray(userId)) assignedUsers = userId;
      else if (userId) assignedUsers = [userId];

      // Keep only valid ObjectIds
      assignedUsers = assignedUsers
        .map((x) => String(x))
        .filter((x) => isValidObjectId(x))
        .map((x) => toObjectId(x));

      assignedUsers = uniqObjectIds(assignedUsers);
    }

    const event = new Event({
      eventType,
      title,
      date: parsedDate,
      duration: durationNum,
      trainerId: toObjectId(authId),
      userId: assignedUsers,
      trainerOnly: Boolean(trainerOnly),
      location: location || "",
      description: description || "",
      customerEmail: customerEmail || "",
      status: "pending",
      confirmationStatus: "not_sent",
      notificationSent: false,
      rescheduleRequest: {
        requestedBy: null,
        proposedDate: null,
        note: "",
        status: "none",
        respondedAt: null,
      },
      rescheduleHistory: [],
      confirmedUsers: [],
      declinedUsers: [],
    });

    await event.save();
    const populated = await basePopulate(Event.findById(event._id));

    res
      .status(201)
      .json({ message: "Event created successfully.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const payload = { ...req.body };

    // Normalize date/duration if present
    if (payload.date) {
      const d = safeDate(payload.date);
      if (!d) return res.status(400).json({ message: "Invalid date." });
      payload.date = d;
    }
    if (payload.duration != null) {
      const durationNum = Number(payload.duration);
      if (!Number.isFinite(durationNum) || durationNum <= 0) {
        return res.status(400).json({ message: "Invalid duration." });
      }
      payload.duration = durationNum;
    }

    const updated = await Event.findByIdAndUpdate(eventId, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Event not found" });

    const populated = await basePopulate(Event.findById(updated._id));
    res
      .status(200)
      .json({ message: "Event updated successfully", updatedEvent: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to update event", error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const deleted = await Event.findByIdAndDelete(eventId);
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to delete event", error: error.message });
  }
};

exports.updateEventStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!["pending", "completed", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true, runValidators: true },
    );

    if (!updated) return res.status(404).json({ message: "Event not found" });

    const populated = await basePopulate(Event.findById(updated._id));
    res.status(200).json({
      message: `Event status updated to ${status}`,
      updatedEvent: populated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to update event status", error: error.message });
  }
};

/* -------------------------
   User-specific: list + unreadCount
-------------------------- */
exports.getUserEvents = async (req, res) => {
  try {
    const authId = req.user?.id || req.user?._id;
    if (!authId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();

    // Fetch only upcoming events assigned to this user
    const events = await Event.find({
      userId: authId,
      trainerOnly: false,
      date: { $gte: now },
    })
      .populate("trainerId", "name email")
      .sort({ date: 1 });

    let pendingInvitesCount = 0;
    let reschedulePendingCount = 0;

    const enrichedEvents = events.map((event) => {
      const confirmed = event.confirmedUsers?.some(
        (u) => String(u) === String(authId),
      );

      const declined = event.declinedUsers?.some(
        (u) => String(u) === String(authId),
      );

      const inviteStatus = confirmed
        ? "accepted"
        : declined
          ? "declined"
          : "pending";

      if (inviteStatus === "pending") {
        pendingInvitesCount++;
      }

      if (event.rescheduleRequest?.status === "pending") {
        reschedulePendingCount++;
      }

      return {
        ...event.toObject(),
        inviteStatus,
      };
    });

    const totalUpcoming = enrichedEvents.length;

    const needsAttentionCount = pendingInvitesCount + reschedulePendingCount;

    const unreadCount = needsAttentionCount;

    res.status(200).json({
      events: enrichedEvents,
      summary: {
        totalUpcoming,
        pendingInvitesCount,
        reschedulePendingCount,
        needsAttentionCount,
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user events.",
      error: error.message,
    });
  }
};

/* -------------------------
   Invite responses
-------------------------- */
exports.confirmEvent = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Must be assigned (unless trainerOnly)
    const assigned = Array.isArray(event.userId)
      ? event.userId.some((x) => String(x) === String(authId))
      : false;

    if (event.trainerOnly || !assigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this event." });
    }

    await Event.findByIdAndUpdate(
      eventId,
      {
        $addToSet: { confirmedUsers: toObjectId(authId) },
        $pull: { declinedUsers: toObjectId(authId) },
      },
      { new: true },
    );

    const populated = await basePopulate(Event.findById(eventId));
    res.status(200).json({ message: "Event confirmed.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error confirming event.", error: error.message });
  }
};

exports.declineEvent = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const assigned = Array.isArray(event.userId)
      ? event.userId.some((x) => String(x) === String(authId))
      : false;

    if (event.trainerOnly || !assigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this event." });
    }

    await Event.findByIdAndUpdate(
      eventId,
      {
        $addToSet: { declinedUsers: toObjectId(authId) },
        $pull: { confirmedUsers: toObjectId(authId) },
      },
      { new: true },
    );

    const populated = await basePopulate(Event.findById(eventId));
    res.status(200).json({ message: "Event declined.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error declining event.", error: error.message });
  }
};

/* -------------------------
   Reschedule request flow
-------------------------- */
exports.requestReschedule = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const eventId = req.params.id;
    const { proposedDate, note } = req.body;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const proposed = safeDate(proposedDate);
    if (!proposed)
      return res.status(400).json({ message: "Invalid proposedDate." });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const assigned = Array.isArray(event.userId)
      ? event.userId.some((x) => String(x) === String(authId))
      : false;

    // Only assigned users OR trainer/admin can create the request.
    // But product-wise, keep it strict: only assigned user should request.
    if (event.trainerOnly || !assigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this event." });
    }

    // Disallow requesting reschedule for past events or non-pending
    if (event.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending events can be rescheduled." });
    }

    event.rescheduleRequest = {
      requestedBy: toObjectId(authId),
      proposedDate: proposed,
      note: String(note || "").slice(0, 500),
      status: "pending",
      respondedAt: null,
    };

    await event.save();
    const populated = await basePopulate(Event.findById(eventId));
    res
      .status(200)
      .json({ message: "Reschedule request submitted.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error requesting reschedule.", error: error.message });
  }
};

exports.acceptReschedule = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending events can be rescheduled." });
    }

    if (
      !event.rescheduleRequest ||
      event.rescheduleRequest.status !== "pending"
    ) {
      return res
        .status(400)
        .json({ message: "No pending reschedule request." });
    }

    const proposed = safeDate(event.rescheduleRequest.proposedDate);
    if (!proposed)
      return res
        .status(400)
        .json({ message: "Invalid proposed date in request." });

    // Push history
    event.rescheduleHistory = Array.isArray(event.rescheduleHistory)
      ? event.rescheduleHistory
      : [];
    event.rescheduleHistory.push({
      previousDate: event.date,
      rescheduledAt: new Date(),
    });

    // Apply new date
    event.date = proposed;

    // Close request
    event.rescheduleRequest.status = "accepted";
    event.rescheduleRequest.respondedAt = new Date();

    await event.save();
    const populated = await basePopulate(Event.findById(eventId));
    res.status(200).json({ message: "Reschedule accepted.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error accepting reschedule.", error: error.message });
  }
};

exports.rejectReschedule = async (req, res) => {
  try {
    const authId = ensureAuthUser(req, res);
    if (!authId) return;

    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      !event.rescheduleRequest ||
      event.rescheduleRequest.status !== "pending"
    ) {
      return res
        .status(400)
        .json({ message: "No pending reschedule request." });
    }

    event.rescheduleRequest.status = "rejected";
    event.rescheduleRequest.respondedAt = new Date();

    await event.save();
    const populated = await basePopulate(Event.findById(eventId));
    res.status(200).json({ message: "Reschedule rejected.", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error rejecting reschedule.", error: error.message });
  }
};

/* -------------------------
   Direct reschedule (Trainer/Admin)
-------------------------- */
exports.rescheduleEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { newDate } = req.body;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const parsed = safeDate(newDate);
    if (!parsed) return res.status(400).json({ message: "Invalid newDate." });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending events can be rescheduled." });
    }

    event.rescheduleHistory = Array.isArray(event.rescheduleHistory)
      ? event.rescheduleHistory
      : [];
    event.rescheduleHistory.push({
      previousDate: event.date,
      rescheduledAt: new Date(),
    });
    event.date = parsed;

    // If there was a pending request, mark it as accepted implicitly
    if (
      event.rescheduleRequest &&
      event.rescheduleRequest.status === "pending"
    ) {
      event.rescheduleRequest.status = "accepted";
      event.rescheduleRequest.respondedAt = new Date();
    }

    await event.save();
    const populated = await basePopulate(Event.findById(eventId));
    res
      .status(200)
      .json({ message: "Event rescheduled successfully", event: populated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to reschedule event", error: error.message });
  }
};

/* -------------------------
   Email confirmation flow (optional)
-------------------------- */
exports.confirmEventEmail = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await basePopulate(
      Event.findByIdAndUpdate(
        eventId,
        { confirmationStatus: "confirmed" },
        { new: true, runValidators: true },
      ),
    );

    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.customerEmail) {
      await sendEmail(
        event.customerEmail,
        "Appointment Confirmation",
        `Your appointment "${event.title}" is confirmed for ${new Date(event.date).toLocaleString()}`,
      );
    }

    res.status(200).json({ message: "Event confirmed and email sent", event });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to confirm event", error: error.message });
  }
};

/* -------------------------
   Notify upcoming events (email)
-------------------------- */
exports.sendEventNotifications = async (req, res) => {
  try {
    // Send for pending future events only
    const now = new Date();

    const events = await basePopulate(
      Event.find({
        status: "pending",
        date: { $gte: now },
        trainerOnly: false,
      }).sort({ date: 1 }),
    );

    const sent = [];
    for (const ev of events) {
      if (!Array.isArray(ev.userId) || ev.userId.length === 0) continue;

      for (const u of ev.userId) {
        const email = u?.email;
        if (!email) continue;

        await sendEmail(
          email,
          "Upcoming Event",
          `You have an event: ${ev.title}`,
        );
        sent.push({ eventId: ev._id, userId: u._id, email });
      }
    }

    res.status(200).json({
      message: "Notifications sent successfully.",
      sentCount: sent.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending notifications.", error: error.message });
  }
};
