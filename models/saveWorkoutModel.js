const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roundSchema = new Schema({
  reps: Number,
  weight: Number,
  unit: { type: String, default: "kg" },
  saved: { type: Boolean, default: false },
});

const sessionSchema = new Schema({
  date: { type: Date, default: Date.now },
  rounds: [roundSchema],
});

const saveWorkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },

  workoutName: String,
  description: String,
  picture: String,
  video: String,
  type: String,

  // Order inside "Today's Workout"
  order: { type: Number, default: 0 },

  // Today's selected rounds
  rounds: [roundSchema],

  // Complete history of this workout
  sessionHistory: [sessionSchema],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SaveWork", saveWorkSchema);
