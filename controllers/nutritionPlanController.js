const NutritionPlan = require("../models/NutritionPlan");
const User = require("../models/userModel");
const { buildNutritionProfile } = require("../nutritionEngine/profile");
const mongoose = require("mongoose");
const { generatePlanLogic } = require("../services/generatePlanLogic");

// =============================
// GENERADOR INTELIGENTE
// =============================

// =============================
// CREATE NUTRITION PLAN
// =============================
exports.createPlan = async (req, res) => {
  try {
    const {
      userId,
      duration,
      calories: bodyCalories,
      macros: bodyMacros,
      meta: bodyMeta,
      medicalFlags: bodyMedicalFlags,
      activityLevel: bodyActivityLevel,
      meals,
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId.",
      });
    }

    // =============================
    // FETCH USER
    // =============================
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =============================
    // ACCESS CONTROL
    // =============================
    const authRole = req.user?.role;
    const authUserId = req.user?._id || req.user?.id;

    const isAdmin = authRole === "admin";
    const isTrainer = authRole === "personal-trainer";

    if (!isAdmin && !isTrainer) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (isTrainer) {
      const trainerOwnsClient =
        user.trainerId && String(user.trainerId) === String(authUserId);

      if (!trainerOwnsClient) {
        return res.status(403).json({
          message: "Access denied to this client.",
        });
      }
    }

    // =============================
    // PROFILE FROM ENGINE
    // =============================
    let profile = null;

    try {
      profile = buildNutritionProfile(user);
    } catch (profileError) {
      console.error("buildNutritionProfile error:", profileError);
      profile = null;
    }

    // =============================
    // SAFE MACROS SOURCE
    // Priority:
    // 1. Frontend body macros
    // 2. Engine profile macros
    // =============================
    const sourceMacros =
      bodyMacros && typeof bodyMacros === "object"
        ? bodyMacros
        : profile?.macros || null;

    const sourceCalories =
      bodyCalories !== undefined && bodyCalories !== null
        ? bodyCalories
        : profile?.calories;

    const safeCalories = Math.round(Number(sourceCalories));

    const safeMacros = {
      protein: Math.round(Number(sourceMacros?.protein)),
      carbs: Math.round(Number(sourceMacros?.carbs)),
      fats: Math.round(Number(sourceMacros?.fats)),
      fiber: Math.round(
        Number(sourceMacros?.fiber || sourceMacros?.fiberTarget || 0),
      ),
    };

    // =============================
    // VALIDATION BEFORE MONGOOSE
    // =============================
    if (
      !Number.isFinite(safeCalories) ||
      safeCalories <= 0 ||
      !Number.isFinite(safeMacros.protein) ||
      safeMacros.protein < 0 ||
      !Number.isFinite(safeMacros.carbs) ||
      safeMacros.carbs < 0 ||
      !Number.isFinite(safeMacros.fats) ||
      safeMacros.fats < 0
    ) {
      return res.status(400).json({
        message: "Calories and valid macros are required to create a nutrition plan.",
        received: {
          bodyCalories,
          bodyMacros,
          profileCalories: profile?.calories,
          profileMacros: profile?.macros,
        },
      });
    }

    // =============================
    // SAFE META
    // =============================
    const safeMeta = {
      ...(profile?.meta || {}),
      ...(bodyMeta && typeof bodyMeta === "object" ? bodyMeta : {}),
    };

    // =============================
    // OPTIONAL CONTEXT
    // =============================
    let generated = null;

    try {
      generated = typeof generatePlanLogic === "function" ? generatePlanLogic(user) : null;
    } catch (logicError) {
      console.error("generatePlanLogic error:", logicError);
      generated = null;
    }

    // =============================
    // CREATE PLAN
    // =============================
    const newPlan = new NutritionPlan({
      userId,
      trainerId: authUserId,
      duration: duration || "weekly",

      calories: safeCalories,
      macros: safeMacros,

      meta: safeMeta,

      medicalFlags: Array.isArray(bodyMedicalFlags)
        ? bodyMedicalFlags
        : user.medicalFlags || [],

      activityLevel:
        bodyActivityLevel || user.activityLevel || safeMeta.activityLevel || "light",

      context: generated?.context || {},

      meals: Array.isArray(meals) ? meals : [],
    });

    const savedPlan = await newPlan.save();

    return res.status(201).json(savedPlan);
  } catch (error) {
    console.error("Error creating nutrition plan:", error);

    return res.status(500).json({
      message: "Unable to create nutrition plan",
      error: error.message,
    });
  }
};

// =============================
// GET PLAN BY USER
// =============================
exports.getPlanByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId.",
      });
    }

    // =============================
    // FETCH USER FOR ACCESS CONTROL
    // =============================
    const user = await User.findById(userId).select("trainerId role");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const authRole = req.user?.role;
    const authUserId = req.user?._id || req.user?.id;

    const isAdmin = authRole === "admin";
    const isTrainer = authRole === "personal-trainer";
    const isClient = authRole === "basic";

    if (!isAdmin && !isTrainer && !isClient) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (isTrainer) {
      const trainerOwnsClient =
        user.trainerId && String(user.trainerId) === String(authUserId);

      if (!trainerOwnsClient) {
        return res.status(403).json({
          message: "Access denied to this client.",
        });
      }
    }

    if (isClient && String(authUserId) !== String(userId)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const plans = await NutritionPlan.find({ userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching nutrition plans:", error);

    return res.status(500).json({
      message: "Unable to fetch nutrition plans",
      error: error.message,
    });
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
