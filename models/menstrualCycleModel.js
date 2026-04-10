const mongoose = require("mongoose");

const DailyLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  energy: { type: Number, min: 1, max: 5 },
  fatigue: { type: Number, min: 1, max: 5 },
  sleep: { type: Number, min: 1, max: 5 },
  performance: { type: Number, min: 1, max: 5 },
  mood: { type: Number, min: 1, max: 5 },
});

const CycleInsightsSchema = new mongoose.Schema({
  currentPhase: String,
  dayOfCycle: Number,
  cycleHealthScore: Number,
  energyAvailabilityScore: Number,
  riskFlags: [String],
  recommendations: {
    training: [String],
    nutrition: [String],
  },
});

const MenstrualCycleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  lastMenstruationDate: { type: Date, required: true },
  cycleLength: { type: Number, default: 28 },

  dailyLogs: [DailyLogSchema],

  insights: CycleInsightsSchema,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MenstrualCycle", MenstrualCycleSchema);
