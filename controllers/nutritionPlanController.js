const NutritionPlan = require("../models/NutritionPlan");
const User = require("../models/userModel");
const { buildNutritionProfile } = require("../nutritionEngine/profile");

// =============================
// GENERADOR INTELIGENTE
// =============================
const generatePlanLogic = (user) => {
  const weight = user.weight || 70;
  const goal = user.goal || "maintenance";

  let calories = 0;

  //  BASE CALÓRICA
  if (goal === "fat_loss") {
    calories = weight * 22;
  } else if (goal === "muscle_gain") {
    calories = weight * 30;
  } else {
    calories = weight * 26;
  }

  // AJUSTES POR CONTEXTO FEMENINO
  const cyclePhase = user?.femaleProfile?.cycleData?.phase;

  if (cyclePhase === "luteal") {
    calories += 150;
  }

  if (cyclePhase === "menstrual") {
    calories -= 100;
  }

  //  MACROS
  const protein = Math.round(weight * 2); // g
  const fats = Math.round(weight * 0.8); // g

  const remainingCalories = calories - (protein * 4 + fats * 9);
  const carbs = Math.max(Math.round(remainingCalories / 4), 0);

  return {
    calories: Math.round(calories),
    macros: {
      protein,
      carbs,
      fats,
    },
    context: {
      goal: user.goal,
      weight: user.weight,
      cyclePhase,
    },
  };
};

// =============================
// CREATE PLAN
// =============================

exports.createPlan = async (req, res) => {
  try {
    const { userId, duration } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    //  Traer usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //  PERFIL NUTRICIONAL (FUENTE DE VERDAD)
    const profile = buildNutritionProfile(user);
    console.log("PROFILE META:", profile.meta);
    if (!profile) {
      return res
        .status(400)
        .json({ error: "Invalid user data for nutrition profile" });
    }

    //  GENERAR CONTEXTO ADICIONAL (si usas generatePlanLogic)
    const generated = generatePlanLogic(user);

    //  CREAR PLAN
    const newPlan = new NutritionPlan({
      userId,
      trainerId: req.user?._id,
      duration: duration || "weekly",

      // CORE
      calories: profile.calories,
      macros: profile.macros,

      //  AQUÍ ESTÁ EL FIX IMPORTANTE
      meta: profile.meta,

      // CONTEXTO EXTRA (opcional)
      context: generated?.context || {},

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
  console.log("PROFILE META:", profile.meta);
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
