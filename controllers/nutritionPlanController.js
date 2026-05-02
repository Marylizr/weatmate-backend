const NutritionPlan = require("../models/NutritionPlan");
const User = require("../models/userModel");


// =============================
// CREATE PLAN
// =============================
exports.createPlan = async (req, res) => {
  try {
    const { userId, duration } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 🔹 Traer usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // =============================
    // CORE ENGINE (SOURCE OF TRUTH)
    // =============================
    const profile = buildNutritionProfile(user);

    if (!profile) {
      return res.status(400).json({
        error: "Invalid user data for nutrition profile",
      });
    }

    // =============================
    // CREAR PLAN
    // =============================
    const newPlan = new NutritionPlan({
      userId,
      trainerId: req.user?._id,
      duration: duration || "weekly",

      //  CORE
      calories: profile.calories,
      macros: profile.macros,

      //  META (IMPORTANTÍSIMO PARA FRONT)
      meta: profile.meta,

      //  CONTEXTO
      context: {
        goal: profile.goal,
        weight: profile.weight,
        conditions: profile.flags,
        cyclePhase: user?.femaleProfile?.cycleData?.currentPhase || null,
      },

      meals: [],
    });

    const savedPlan = await newPlan.save();

    return res.status(201).json({
      message: "Nutrition plan created successfully",
      plan: savedPlan,
    });
  } catch (error) {
    console.error("Error creating nutrition plan:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// =============================
// GET PLAN BY USER
// =============================
exports.getPlanByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const plans = await NutritionPlan.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// =============================
// UPDATE PLAN
// =============================
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await NutritionPlan.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// =============================
// DELETE PLAN
// =============================
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await NutritionPlan.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Server error" });
  }
};
