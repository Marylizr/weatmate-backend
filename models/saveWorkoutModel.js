const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const saveWorkSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false, // importante: no rompe workouts antiguos
  },
  name: String,
  type: String,
  workoutName: String,
  description: String,
  lifted: Number,
  reps: Number,
  series: Number,
  date: { type: Date, default: Date.now },
  picture: String,
  video: String,
});

const SaveWork = mongoose.model("saveWork", saveWorkSchema);

module.exports = SaveWork;
