const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Standard levels across the app: beginner | intermediate | advanced
// Legacy values supported: basic -> beginner, medium -> intermediate
const normalizeLevel = (v) => {
  if (!v) return v;
  const value = String(v).toLowerCase().trim();
  if (value === "basic") return "beginner";
  if (value === "medium") return "intermediate";
  return value;
};

const preWorkoutSchema = new Schema(
  {
    name: String,
    infotype: { type: String, default: "workout-plan" },

    subCategory: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      set: normalizeLevel,
    },

    date: { type: Date, required: true }, // IMPORTANT: daily assignment

    picture: String,
    content: String,

    trainerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    planName: String,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("preWorkout", preWorkoutSchema);
