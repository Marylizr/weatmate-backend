const Event = require('../models/eventModel');
const User = require('../models/userModel');
const sendEmail = require('../emailService'); // Assuming an email service is available

// Get all events with populated user and trainer details
exports.findAll = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('userId', 'name email image') // Ensure 'email' is included here
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
      .populate('userId', 'name email image')
      .populate('trainerId', 'name email');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Unable to find event", error: error.message });
  }
};

// Create a new event
exports.create = async (req, res) => {
  const { eventType, title, date, duration, userId, customerEmail, location, description, trainerOnly } = req.body;
  const trainerId = req.trainer._id; // Get the trainer ID from the authenticated request

  if (!eventType || !title || !date || !duration || !trainerId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newEvent = new Event({
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId: userId || null,
      customerEmail: customerEmail || null,
      location,
      description,
      trainerOnly: trainerOnly || false,
      status: 'pending',
      confirmationStatus: 'not_sent'
    });

    const savedEvent = await newEvent.save();
    res.status(201).json({ message: "Event created successfully", newEvent: savedEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Unable to create event", error: error.message });
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

