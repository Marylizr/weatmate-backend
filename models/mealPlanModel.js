const mongoose = require("mongoose");

const mealTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },

  foods: [
    {
      name: String,
      portion: Object,
      quantity: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      calories: Number,
    },
  ],

  totalMacros: {
    protein: Number,
    carbs: Number,
    fats: Number,
    calories: Number,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("MealTemplate", mealTemplateSchema);
