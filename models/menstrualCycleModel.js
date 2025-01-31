const mongoose = require("mongoose");

const MenstrualCycleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  lastMenstruationDate: { 
    type: Date, 
    required: true 
  },
  currentPhase: { 
    type: String, 
    enum: ["Menstrual", "Follicular", "Luteal"], 
    required: true 
  },
  trainingRecommendations: { 
    type: [String], 
    required: true 
  }, // Save training separately
  nutritionRecommendations: { 
    type: [String], 
    required: true 
  }, // Save nutrition separately
  date: { type: Date, default: Date.now }, // Current log date
  history: [{
    date: { type: Date, default: Date.now },
    lastMenstruationDate: Date,
    currentPhase: String,
    trainingRecommendations: [String],
    nutritionRecommendations: [String]
  }] // Store previous cycle logs
});

module.exports = mongoose.model("MenstrualCycle", MenstrualCycleSchema);
