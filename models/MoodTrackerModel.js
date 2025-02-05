const mongoose = require("mongoose");

const MoodTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mood: {
    type: String,
    required: true,
    enum: ["Happy", "Sad", "Stressed", "Anxious", "Excited", "Tired", "Other"],
  },
  comments: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  motivationalMessage: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("MoodTracker", MoodTrackerSchema);
