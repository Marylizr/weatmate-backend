const Event = require('../models/eventModel');
const User = require('../models/userModel');
const sendEmail = require('../sendVerificationEmail'); 


exports.findAll = async (req, res) => {
  try {
    const query = req.query.userId ? { userId: req.query.userId } : {};
    
    const events = await Event.find(query)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email');

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve events", error: error.message });
  }
};


// Find a specific event by ID with populated user and trainer details
exports.findOne = async (req, res) => {
  const eventId = req.params.id;
  try {
    const event = await Event.findById(eventId)
      .populate('userId', 'name email') // Populate user info (name, email)
      .populate('trainerId', 'name email'); // Populate trainer info

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Unable to find event", error: error.message });
  }
};


exports.create = async (req, res) => {
  try {
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
      status,
      confirmationStatus,
      rescheduleHistory
    } = req.body;

    // Ensure trainerId is coming from the authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Trainer ID is missing." });
    }
    const trainerId = req.user.id;

    // If the event is Trainer-Only, userId should be an empty array
    let assignedUsers = trainerOnly ? [] : userId;

    // Validate required fields
    if (!eventType || !title || !date || !duration) {
      return res.status(400).json({ message: "Missing required event details." });
    }

    // Create the event
    const event = new Event({
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId: assignedUsers, // Should be empty if trainerOnly is true
      trainerOnly,
      location,
      description,
      customerEmail,
      status,
      confirmationStatus,
      rescheduleHistory,
    });

    await event.save();

    res.status(201).json({ message: "Event created successfully.", event });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



// Confirm an event and send a confirmation email
exports.confirmEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findByIdAndUpdate(
      id,
      { confirmationStatus: 'confirmed' },
      { new: true }
    ).populate('userId', 'email name');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.customerEmail) {
      await sendEmail(
        event.customerEmail,
        'Appointment Confirmation',
        `Your appointment "${event.title}" is confirmed for ${event.date.toLocaleString()}`
      );
    }

    res.status(200).json({ message: "Event confirmed and email sent", event });
  } catch (error) {
    console.error("Error confirming event:", error);
    res.status(500).json({ message: "Unable to confirm event", error: error.message });
  }
};

// Reschedule an event and maintain reschedule history
exports.rescheduleEvent = async (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Add current date to reschedule history
    event.rescheduleHistory.push({ previousDate: event.date });
    event.date = newDate;

    await event.save();
    res.status(200).json({ message: "Event rescheduled successfully", event });
  } catch (error) {
    console.error("Error rescheduling event:", error);
    res.status(500).json({ message: "Unable to reschedule event", error: error.message });
  }
};

// Delete an event
exports.delete = async (req, res) => {
  const id = req.params.id;
  console.log(`Attempting to delete event with ID: ${id}`);

  try {
    const result = await Event.findByIdAndDelete(id);
    console.log(`Delete result: ${result}`);

    if (!result) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: "Unable to delete event", error: error.message });
  }
};

exports.cancelEvent = async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { $pull: { userId: req.user.id } });
    res.status(200).json({ message: "Event canceled." });
  } catch (error) {
    res.status(500).json({ message: "Error canceling event.", error: error.message });
  }
};


// Update an event
exports.update = async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const updatedEvent = await Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event updated successfully", updatedEvent });
  } catch (error) {
    res.status(500).json({ message: "Unable to update event", error: error.message });
  }
};

// Controller method to update the status of an event
exports.updateEventStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status input
  if (!['pending', 'completed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // Find the event by ID and update the status
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: `Event status updated to ${status}`, updatedEvent });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ message: "Unable to update event status", error: error.message });
  }
};

exports.getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id });
    const unreadCount = events.filter(event => !event.confirmedUsers.includes(req.user.id)).length;
    
    res.status(200).json({ events, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events.", error: error.message });
  }
};

exports.confirmEvent = async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { $addToSet: { confirmedUsers: req.user.id } });
    res.status(200).json({ message: "Event confirmed." });
  } catch (error) {
    res.status(500).json({ message: "Error confirming event.", error: error.message });
  }
};

// Send Event Notifications
exports.sendEventNotifications = async (req, res) => {
  try {
    const events = await Event.find({ status: "pending" }).populate("userId", "email name");
    events.forEach(event => {
      if (event.userId.email) {
        sendEmail(event.userId.email, "Upcoming Event", `You have an event: ${event.title}`);
      }
    });

    res.status(200).json({ message: "Notifications sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error sending notifications.", error: error.message });
  }
};