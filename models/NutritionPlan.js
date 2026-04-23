const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FoodSchema = new Schema(
  {
    name: { type: String, required: true },
    grams: { type: Number, required: true },

    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
  },
  { _id: false },
);

const MealSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },

    foods: [FoodSchema],

    totalMacros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      calories: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const NutritionPlanSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    duration: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "weekly",
    },

    calories: {
      type: Number,
      required: true,
    },

    macros: {
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fats: { type: Number, required: true },
    },

    meals: [MealSchema],

    context: {
      goal: { type: String },
      weight: { type: Number },
      fatigue: { type: String },
      cyclePhase: { type: String },
      conditions: [{ type: String }],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("NutritionPlan", NutritionPlanSchema);
