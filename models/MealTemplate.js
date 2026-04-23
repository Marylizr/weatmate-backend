const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  portion: {
    label: String,
    grams: Number,
  },
  protein: Number,
  carbs: Number,
  fats: Number,
  calories: Number,
});

const mealSchema = new mongoose.Schema({
  name: String,
  foods: [foodSchema],
  totalMacros: {
    protein: Number,
    carbs: Number,
    fats: Number,
    calories: Number,
  },
});

const mealTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meals: [mealSchema],
  },
  { timestamps: true },
);

export default mongoose.model("MealTemplate", mealTemplateSchema);
