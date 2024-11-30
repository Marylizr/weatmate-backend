const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MealPlanSchema = new Schema({
  userName: {
    type: String,
    required: true, // Ensure userName is mandatory
    trim: true,
  },
  infotype: {
    type: String,
    enum: ["recipes"], // Restrict to "workouts"
    required: true,
  },
  subCategory: {
    type: String,
    enum: ["vegan", "vegetarian", "keto", "paleo", "gluten-free", "mediterranean", "low-carb"], // Restrict to predefined levels
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  picture: {
    type: String,
    trim: true, // Ensure no extra whitespace
  },
  content: {
    type: String,
    required: true, // Ensure workout content is provided
  },
});

// Add indexing for better query performance
MealPlanSchema.index({ userName: 1, subCategory: 1 });

const MealPlan = mongoose.model("MealPlan", MealPlanSchema);

module.exports = MealPlan;
