const MoodTracker = require('../models/MoodTrackerModel');
const mongoose = require('mongoose');

// Fetch all mood entries (optional: add pagination or filtering)
exports.findAll = async (req, res) => {
  try {
    const moods = await MoodTracker.find().populate('userName', 'name email'); // Populate user info if needed
    res.status(200).json(moods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a specific mood entry by ID
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await MoodTracker.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Mood entry not found." });
    }

    res.status(204).send(); // No content response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find a single mood entry by ID
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const mood = await MoodTracker.findById(id);

    if (!mood) {
      return res.status(404).json({ error: "Mood entry not found." });
    }

    res.status(200).json(mood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new mood entry
exports.create = async (req, res) => {
  const {
    name, // Should be the user's ID
    mood,
    comments = '',
    date = new Date(),
    suggestions = {},
    menstrualCyclePhase = 'Unknown',
  } = req.body;

  // Validate that userName is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(name)) {
    return res.status(400).json({ error: "Invalid userName (must be a valid ObjectId)." });
  }

  try {
    const newMood = new MoodTracker({
      name, // Should match the schema field name
      mood,
      comments,
      date,
      suggestions: {
        workout: suggestions.workout || '',
        playlist: suggestions.playlist || '',
        motivationalMessage: suggestions.motivationalMessage || '',
      },
      menstrualCyclePhase,
    });

    await newMood.save();

    console.log("A new mood entry has been created:", newMood);
    res.status(201).json({ message: "Mood entry created successfully.", newMood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an existing mood entry by ID
exports.update = async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const updatedMood = await MoodTracker.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true } // Return updated document and validate input
    );

    if (!updatedMood) {
      return res.status(404).json({ error: "Mood entry not found." });
    }

    res.status(200).json({ message: "Mood entry updated successfully.", updatedMood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
