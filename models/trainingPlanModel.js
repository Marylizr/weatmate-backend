// models/trainingPlanModel.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ExerciseSchema = new Schema(
  {
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: "Workout", // adjust if your workout model name differs
      required: true,
    },

    order: { type: Number, default: 0 },

    // Programming fields (optional but structured)
    sets: { type: Number, default: 0 },
    repsMin: { type: Number, default: 0 },
    repsMax: { type: Number, default: 0 },

    // Intensity targets (optional)
    loadKg: { type: Number, default: 0 },
    percent1RM: { type: Number, default: 0 },
    rpe: { type: Number, default: 0 },
    rir: { type: Number, default: 0 },

    // Tempo/rest
    restSec: { type: Number, default: 0 },
    tempo: { type: String, default: "" },

    // Notes and substitutions
    notes: { type: String, default: "" },
    substitutions: [
      {
        workoutId: { type: Schema.Types.ObjectId, ref: "Workout" },
        note: { type: String, default: "" },
      },
    ],
  },
  { _id: true },
);

const DaySchema = new Schema({
  date: { type: String, default: "" },
  dayOfWeek: { type: Number, min: 0, max: 6, default: 0 },

  title: { type: String, default: "" },
  focus: { type: String, default: "" },

  durationMin: { type: Number, default: 0 },
  warmup: { type: String, default: "" },
  cooldown: { type: String, default: "" },
  notes: { type: String, default: "" },

  rpeCap: { type: Number, default: 0 },
  volumeCap: { type: Number, default: 0 },

  // SOLO ESTRUCTURA
  macros: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
  },

  exercises: { type: [ExerciseSchema], default: [] },
});
const WeekSchema = new Schema(
  {
    weekIndex: { type: Number, required: true }, // 1..N
    startDate: { type: String, default: "" }, // "YYYY-MM-DD"
    endDate: { type: String, default: "" }, // "YYYY-MM-DD"

    label: { type: String, default: "" }, // e.g. "Week 2"
    focus: { type: String, default: "" }, // e.g. "Volume"
    isDeload: { type: Boolean, default: false },

    days: { type: [DaySchema], default: [] },
  },
  { _id: true },
);

const MesoSchema = new Schema(
  {
    name: { type: String, default: "" }, // e.g. "Meso 1 - Base"
    startWeek: { type: Number, default: 1 },
    endWeek: { type: Number, default: 4 },
    goal: { type: String, default: "" }, // hypertrophy/strength/etc
    notes: { type: String, default: "" },
    deloadEvery: { type: Number, default: 0 }, // e.g. 4 -> every 4th week
  },
  { _id: true },
);

const TrainingPlanSchema = new Schema(
  {
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    title: { type: String, default: "Training Plan" },
    description: { type: String, default: "" },

    // Macro fields
    macroGoal: { type: String, default: "" },
    startDate: { type: String, default: "" }, // "YYYY-MM-DD"
    endDate: { type: String, default: "" }, // "YYYY-MM-DD"
    totalWeeks: { type: Number, default: 0 },

    // Meso plan (optional)
    mesocycles: { type: [MesoSchema], default: [] },

    // Microcycle content
    weeks: { type: [WeekSchema], default: [] },

    // Publishing/versioning
    version: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },

    // Active selection
    isActive: { type: Boolean, default: true, index: true },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    weekStart: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

// Ensure a trainer doesn't accidentally set multiple active published plans for same client
TrainingPlanSchema.index(
  { trainerId: 1, clientId: 1, status: 1, isActive: 1 },
  { partialFilterExpression: { status: "published", isActive: true } },
);

module.exports = mongoose.model("TrainingPlan", TrainingPlanSchema);
