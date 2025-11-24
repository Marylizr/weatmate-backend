const MoodTracker = require("../models/MoodTracker");

// === CREATE ===
exports.create = async (req, res) => {
  try {
    const { userId, mood, suggestions, comments, date } = req.body;

    if (!userId || !mood) {
      return res.status(400).json({
        success: false,
        error: "userId and mood are required",
      });
    }

    // Extract motivational message if suggestions exist
    let message = "";
    if (suggestions && suggestions.length > 0) {
      // suggestions = [{ title: "Motivational Message", content: "..." }]
      message = suggestions[0].content || "";
    }

    const newMood = new MoodTracker({
      userId,
      mood,
      comments: comments || "",
      date: date || new Date(),
      motivationalMessage: message,
    });

    await newMood.save();

    res.status(201).json({
      success: true,
      message: "Mood logged successfully",
      data: newMood,
    });
  } catch (error) {
    console.error("Error saving mood:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// === FIND ALL ===
exports.findAll = async (req, res) => {
  try {
    const { userId } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;

    const moods = await MoodTracker.find(filter).sort({ date: -1 }).lean();

    res.status(200).json({
      success: true,
      count: moods.length,
      data: moods,
    });
  } catch (error) {
    console.error("Error fetching moods:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// === FIND ONE ===
exports.findOne = async (req, res) => {
  try {
    const mood = await MoodTracker.findById(req.params.id);

    if (!mood) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.status(200).json({ success: true, data: mood });
  } catch (error) {
    console.error("Error fetching mood:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// === DELETE ===
exports.delete = async (req, res) => {
  try {
    const deleted = await MoodTracker.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.status(200).json({
      success: true,
      message: "Mood deleted",
      deleted,
    });
  } catch (error) {
    console.error("Error deleting mood:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// === UPDATE ===
exports.update = async (req, res) => {
  try {
    const { comments, mood, motivationalMessage } = req.body;

    const updated = await MoodTracker.findByIdAndUpdate(
      req.params.id,
      {
        ...(comments && { comments }),
        ...(mood && { mood }),
        ...(motivationalMessage && { motivationalMessage }),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating mood:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
