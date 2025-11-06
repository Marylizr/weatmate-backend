const mongoose = require("mongoose");

const addWorkoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: false,
    },
    workoutName: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    reps: {
      type: String,
      required: false,
    },
    series: {
      type: String,
      required: false,
    },
    picture: {
      type: String,
      required: false,
    },
    video: {
      type: String,
      required: false,
    },
    workoutLevel: {
      type: String,
      enum: ["basic", "medium", "advanced"],
      required: false,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isGeneral: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AddWork = mongoose.model("AddWork", addWorkoutSchema);

module.exports = AddWork;
