const Event = require('../models/eventModel');
const User = require('../models/userModel');

// Get all events
exports.findAll = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve events", error: error.message });
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

// Find one event by ID or query parameter
exports.findOne = async (req, res) => {
  const { title, eventType } = req.query;

  try {
    let query = {};
    if (title) {
      query.title = title;
    } else if (eventType) {
      query.eventType = eventType;
    } else {
      return res.status(400).json({ message: "Please provide either a title or eventType to search" });
    }

    const event = await Event.findOne(query);
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
  const { eventType, title, date, duration, userId, location, description } = req.body;
  const trainerId = req.trainer._id; // Get the trainer ID from the authenticated request

  // Validating required fields
  if (!eventType || !title || !date || !duration || !trainerId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Log input data for troubleshooting
    console.log('Creating event with data:', {
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId,
      location,
      description,
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
        });
        return await event.save();
      }));

      return res.status(201).json({ message: "Events were created successfully for all users", events: newEvents });
    }

    // Handle event for personal trainer only (no userId)
    const newEvent = new Event({
      eventType,
      title,
      date,
      duration,
      trainerId,
      userId: userId ? userId : undefined, // Use undefined to omit userId if it's for trainer only
      location,
      description,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json({ message: "Event was created successfully", newEvent: savedEvent });
  } catch (error) {
    console.error("Error creating event:", error); // Log full error stack
    res.status(500).json({ message: "Unable to create event", error: error.message });
  }
};

// Update an event
exports.update = async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
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
