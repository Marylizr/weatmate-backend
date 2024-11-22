const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PreWorkoutSchema = new Schema({
  userName: {
    type: String,
    required: true, // Ensure userName is mandatory
    trim: true,
  },
  infotype: {
    type: String,
    enum: ["workouts"], // Restrict to "workouts"
    required: true,
  },
  subCategory: {
    type: String,
    enum: ["basic", "medium", "advanced"], // Restrict to predefined levels
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  picture: {
    type: String,
    trim: true, // Ensure no extra whitespace
  },
  content: {
    type: String,
    required: true, // Ensure workout content is provided
  },
});

// Add indexing for better query performance
PreWorkoutSchema.index({ userName: 1, subCategory: 1 });

const PreWorkout = mongoose.model("PreWorkout", PreWorkoutSchema);

module.exports = PreWorkout;
