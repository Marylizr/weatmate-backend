const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NutritionSchema = new Schema(
  {
    // Title of the meal plan or recipe
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Main body of the plan (IA text or manual text)
    content: {
      type: String,
      required: true,
    },

    // Image (optional)
    picture: {
      type: String,
      default: null,
    },

    // Nutrition type (keto, vegan, etc.)
    type: {
      type: String,
      enum: [
        "vegan",
        "vegetarian",
        "keto",
        "low-carb",
        "mediterranean",
        "paleo",
        "gluten-free",
        "custom",
      ],
      default: "custom",
    },

    // Trainer creating the plan
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Whether this plan is general or only for trainer
    isGeneral: {
      type: Boolean,
      default: false,
    },

    // Future expansion: weekly structure (optional)
    weeklyPlan: {
      type: Array,
      default: [], // later we can store "day-by-day" structure
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Nutrition", NutritionSchema);
