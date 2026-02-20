const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AssignedWorkoutSchema = new Schema(
  {
    workoutId: { type: Schema.Types.ObjectId, ref: "Workout" },
    type: { type: String, default: "" },
    workoutName: { type: String, default: "" },
    description: { type: String, default: "" },
    reps: { type: String, default: "" },
    series: { type: String, default: "" },
    picture: { type: String, default: "" },
    video: { type: String, default: "" },
    workoutLevel: { type: String, default: "" }, // beginner/medium/advanced (optional)
    subType: { type: String, default: "" }, // biceps/triceps/etc (optional)
  },
  { _id: false }
);

const DesignedByPtSchema = new Schema(
  {
    // owner
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // day key (store as YYYY-MM-DD to avoid timezone drift)
    date: { type: String, required: true, index: true },

    // optional metadata
    dayLabel: { type: String, default: "" }, // e.g. "Upper", "Lower"
    notes: { type: String, default: "" },
    createdFromTemplate: { type: Boolean, default: false },
    templateName: { type: String, default: "" },

    // workouts for that day
    workouts: { type: [AssignedWorkoutSchema], default: [] },
  },
  { timestamps: true }
);

// Make userId+date unique to enforce "one record per day per user"
DesignedByPtSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DesignedByPt", DesignedByPtSchema);
