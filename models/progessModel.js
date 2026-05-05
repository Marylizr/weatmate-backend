const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    weight: {
      type: Number,
      min: 0,
      default: null,
    },

    waist: {
      type: Number,
      min: 0,
      default: null,
    },

    hips: {
      type: Number,
      min: 0,
      default: null,
    },

    chest: {
      type: Number,
      min: 0,
      default: null,
    },

    neck: {
      type: Number,
      min: 0,
      default: null,
    },

    bodyFat: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    picture: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

ProgressSchema.index({ userId: 1, date: -1 });
ProgressSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Progress", ProgressSchema);
