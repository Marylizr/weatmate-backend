const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LoggedFoodSchema = new Schema(
  {
    name: { type: String, required: true },
    grams: { type: Number },

    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },

    source: {
      type: String,
      enum: ["manual", "ai_estimated"],
      default: "manual",
    },
  },
  { _id: false },
);

const MealLogSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },

    foods: [LoggedFoodSchema],

    totalMacros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      calories: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const NutritionLogSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    meals: [MealLogSchema],

    totalDailyMacros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      calories: { type: Number, default: 0 },
    },

    notes: {
      type: String,
      default: "",
    },

    adherence: {
      calories: { type: Number, default: 0 }, // %
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("NutritionLog", NutritionLogSchema);
