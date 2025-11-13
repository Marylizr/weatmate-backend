const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PreWorkoutSchema = new Schema({
  name: { type: String, required: true, trim: true },
  infotype: { type: String, enum: ["workouts"], required: true },
  subCategory: {
    type: String,
    enum: ["basic", "medium", "advanced"],
    required: true,
  },
  date: { type: Date, default: Date.now },
  picture: { type: String, trim: true },
  content: { type: String, required: true },

  // Relación real
  trainerId: { type: Schema.Types.ObjectId, ref: "User" },
  userId: { type: Schema.Types.ObjectId, ref: "User" },

  startDate: { type: Date },
  endDate: { type: Date },
  planName: { type: String, trim: true },
});

PreWorkoutSchema.index({ userId: 1, subCategory: 1 });

const PreWorkout = mongoose.model("PreWorkout", PreWorkoutSchema);
module.exports = PreWorkout;
