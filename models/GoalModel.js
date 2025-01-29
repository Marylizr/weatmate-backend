const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goalType: {
    type: String,
    enum: ['weight', 'strength', 'endurance', 'custom'],
    required: true,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  measure: {
    type: String,
    required: false, // Ensure the measure is required for clarity
  },
  personalNotes: [String],
  progressHistory: [
    {
      date: { type: Date, default: Date.now },
      value: Number,
    },
  ],
  milestones: [
    {
      milestoneValue: { type: Number, required: true },
      achievedAt: { type: Date }, // Optional, added when milestone is achieved
      note: { type: String }, // Add a note field for each milestone
    },
  ],
  goalCreationDate: { type: Date, default: Date.now }, // Automatically set at creation
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Goal', GoalSchema);
