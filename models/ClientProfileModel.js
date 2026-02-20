const mongoose = require("mongoose");

const ClientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTrainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goal: { type: String },
    fitnessLevel: { type: String },
    tags: { type: [String], default: [] },
    femaleProfile: { type: Object, default: {} },
  },
  { timestamps: true }
);

// IMPORTANT: guard against re-compilation
module.exports =
  mongoose.models.ClientProfile ||
  mongoose.model("ClientProfile", ClientProfileSchema);
