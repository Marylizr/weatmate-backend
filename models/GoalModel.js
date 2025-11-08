const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalType: {
      type: String,
      enum: ["weight", "strength", "endurance", "custom"],
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
      required: true,
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
        achievedAt: { type: Date },
        note: { type: String },
      },
    ],
    goalCreationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);
