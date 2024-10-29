const Event = require('../models/eventModel');
const User = require('../models/userModel');

// Get all events with populated user and trainer details
exports.findAll = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('userId', 'name email image') // Populating user details: name, email, image
      .populate('trainerId', 'name email'); // Populating trainer details: name, email

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
      .populate('userId', 'name email image') // Populating user details
      .populate('trainerId', 'name email'); // Populating trainer details

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Unable to find event", error: error.message });
  }
};

// Delete an event
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await Event.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Unable to delete event", error: error.message });
  }
};

// Create a new event
exports.create = async (req, res) => {
  const { eventType, title, date, duration, userId, location, description, trainerOnly } = req.body;
  const trainerId = req.trainer._id; // Get the trainer ID from the authenticated request

  // Validating required fields
  if (!eventType || !title || !date || !duration || !trainerId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    console.log('Creating event with data:', {
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId,
      location,
      description,
      trainerOnly
    });

    // Handle "Select All" scenario
    if (Array.isArray(userId)) {
      const newEvents = await Promise.all(userId.map(async (id) => {
        const event = new Event({
          eventType,
          title,
          date,
          duration,
          trainerId,
          userId: id,
          location,
          description,
          trainerOnly: false, // For group events, set trainerOnly to false
          status: 'pending' // Default status is pending
        });
        return await event.save();
      }));

      return res.status(201).json({ message: "Events were created successfully for all users", events: newEvents });
    }

    // Handle event for personal trainer only (no userId and trainerOnly: true)
    const newEvent = new Event({
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId: userId || null, // If it's for the trainer only, userId will be null
      location,
      description,
      trainerOnly: trainerOnly || false, // Use the trainerOnly flag to mark if it's for the trainer only
      status: 'pending' // Default status is pending
    });

    const savedEvent = await newEvent.save();
    res.status(201).json({ message: "Event was created successfully", newEvent: savedEvent });
  } catch (error) {
    console.error("Error creating event:", error); // Log full error stack
    res.status(500).json({ message: "Unable to create event", error: error.message });
  }
};

// Controller method to get events for a specific user
exports.findEventsByUser = async (req, res) => {
  const { userId } = req.query;
  try {
    const events = await Event.find({ userId: userId }) // Fetch events for the specific user
      .populate('userId', 'name email')
      .populate('trainerId', 'name email');
      
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve events', error: error.message });
  }
};


// Update an event
exports.update = async (req, res) => {
  const id = req.params._id;
  const data = req.body;

  try {
    // Check if updating the status of the event
    if (data.status && ['pending', 'completed', 'canceled'].includes(data.status)) {
      console.log(`Updating status of event ${id} to ${data.status}`);
    }

    // Regular update for a single event
    const updatedEvent = await Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event has been updated successfully", updatedEvent });
  } catch (error) {
    res.status(500).json({ message: "Unable to update event", error: error.message });
  }
};

// Mark event as completed or canceled (custom controller)
exports.updateEventStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['completed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const updatedEvent = await Event.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: `Event has been marked as ${status}`, updatedEvent });
  } catch (error) {
    res.status(500).json({ message: "Unable to update event status", error: error.message });
  }
};
