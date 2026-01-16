const { Schema, model } = require("mongoose");

const roundSchema = new Schema({
  reps: Number,
  weight: Number,
  unit: {
    type: String,
    enum: ["kg", "lb"],
    default: "kg",
  },
});

const favSchema = new Schema({
  name: String,
  type: String,
  workoutName: String,
  description: String,
  rounds: [roundSchema],
  date: { type: Date, default: Date.now },
  picture: String,
  video: String,
});

module.exports = model("fav", favSchema);
