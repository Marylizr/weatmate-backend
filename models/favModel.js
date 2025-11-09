const { Schema, model } = require("mongoose");

const roundSchema = new Schema({
  reps: Number,
  weight: Number,
  unit: {
    type: String,
    enum: ["kg", "lb"], // Ensures only kg or lb are stored
    default: "kg",
  },
});

const favSchema = new Schema({
  name: String,
  type: String,
  workoutName: String,
  description: String,
  rounds: [roundSchema], // Array of rounds
  date: { type: Date, default: Date.now },
  picture: String,
  video: String,
});

const Fav = model("fav", favSchema);

module.exports = Fav;
