const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: String,
  portion: Object,
  quantity: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  calories: Number,
});

const mealTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    foods: [foodSchema],
    totalMacros: {
      protein: Number,
      carbs: Number,
      fats: Number,
      calories: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MealTemplate", mealTemplateSchema);
