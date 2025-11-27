const MoodTracker = require("../models/moodTrackerModel");

// CREATE
exports.create = async (req, res) => {
  console.log("ENTERED MoodTrackerController.create");
  console.log("BODY RECEIVED:", req.body);

  try {
    const { userId, mood, comments, suggestions, motivationalMessage, date } =
      req.body;

    if (!userId || !mood) {
      return res.status(400).json({
        success: false,
        error: "userId and mood are required",
      });
    }

    // Normalizamos suggestions al tipo Array que pide el schema
    let safeSuggestions = [];
    if (Array.isArray(suggestions)) {
      safeSuggestions = suggestions;
    } else if (typeof suggestions === "string" && suggestions.trim() !== "") {
      safeSuggestions = [
        {
          title: "Motivational Message",
          content: suggestions.trim(),
        },
      ];
    }

    const finalMotivationalMessage =
      motivationalMessage ||
      (safeSuggestions[0] && safeSuggestions[0].content) ||
      "";

    const newMood = await MoodTracker.create({
      userId,
      mood,
      comments: comments || "",
      suggestions: safeSuggestions,
      motivationalMessage: finalMotivationalMessage,
      date: date ? new Date(date) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Mood logged successfully",
      data: newMood,
    });
  } catch (error) {
    console.error("Error saving mood:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET ALL
exports.findAll = async (req, res) => {
  try {
    const moods = await MoodTracker.find().sort({ date: -1 });
    res.status(200).json(moods);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET by userId (NECESARIO PARA EL DASHBOARD)
exports.findByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const moods = await MoodTracker.find({ userId }).sort({ date: -1 });

    res.status(200).json(moods);
  } catch (error) {
    console.error("Error fetching mood logs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET by id
exports.findOne = async (req, res) => {
  try {
    const mood = await MoodTracker.findById(req.params.id);
    res.status(200).json(mood);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const updated = await MoodTracker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE
exports.delete = async (req, res) => {
  try {
    await MoodTracker.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Mood deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
