const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,

    weight: Number,
    waist: Number,
    hips: Number,
    chest: Number,
    neck: Number,
    bodyFat: Number,
    date: Date,
    note: String,
    picture: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", ProgressSchema);
