const Goal = require("../models/GoalModel");

// Helper para loggear solo en desarrollo
const isDev = process.env.NODE_ENV !== "production";
const devLog = (...args) => {
  if (isDev) console.log("[GOAL CONTROLLER]", ...args);
};

// Obtener todas las metas de un usuario
exports.getUserGoals = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Missing userId parameter" });
  }

  try {
    const goals = await Goal.find({ userId: id });
    devLog("Fetched goals:", goals.length);
    return res.status(200).json(goals);
  } catch (error) {
    devLog("Error fetching goals:", error.message);
    return res.status(500).json({
      message: "Unable to retrieve goals",
      error: isDev ? error.message : undefined,
    });
  }
};

// Crear una nueva meta
exports.createGoal = async (req, res) => {
  const {
    goalType,
    targetValue,
    currentValue,
    milestones,
    personalNotes,
    measure,
  } = req.body;

  // Tomamos el ID desde el middleware o desde el body si se usa en pruebas
  const userId = req.user?._id || req.body.userId;

  devLog("Decoded User from Token:", req.user?._id);
  devLog("Received payload body:", req.body);

  if (!userId || !goalType || targetValue === undefined || !measure) {
    return res.status(400).json({
      message: "Missing required fields",
      received: req.body,
    });
  }

  try {
    const newGoal = await Goal.create({
      userId, // ✅ campo correcto según el modelo
      goalType,
      targetValue,
      currentValue: currentValue || 0,
      measure,
      milestones: milestones || [],
      personalNotes: personalNotes || [],
    });

    devLog("Goal created successfully:", newGoal._id);
    return res
      .status(201)
      .json({ message: "Goal created successfully", goal: newGoal });
  } catch (error) {
    devLog("Error creating goal:", error.message);
    return res.status(500).json({
      message: "Failed to create goal",
      error: isDev ? error.message : undefined,
    });
  }
};

// Actualizar progreso de una meta
exports.updateGoalProgress = async (req, res) => {
  const { goalId } = req.params;
  const { currentValue } = req.body;

  if (currentValue === undefined) {
    return res.status(400).json({ message: "Current value is required" });
  }

  try {
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.currentValue = currentValue;
    goal.progressHistory.push({ value: currentValue, date: new Date() });

    // Si se alcanzó la meta, marcar milestone
    if (currentValue >= goal.targetValue) {
      goal.milestones.push({
        milestoneValue: goal.targetValue,
        achievedAt: new Date(),
      });
    }

    const updatedGoal = await goal.save();
    devLog("Progress updated for goal:", goalId);
    return res
      .status(200)
      .json({ message: "Goal progress updated", goal: updatedGoal });
  } catch (error) {
    devLog("Error updating goal progress:", error.message);
    return res.status(500).json({
      message: "Unable to update goal progress",
      error: isDev ? error.message : undefined,
    });
  }
};

// Actualizar un milestone
exports.updateGoalMilestone = async (req, res) => {
  const { goalId } = req.params;
  const { milestoneValue, achievedAt, note } = req.body;

  if (!milestoneValue || !achievedAt || !note) {
    return res.status(400).json({
      message: "Missing required milestone data",
    });
  }

  try {
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const existingIndex = goal.milestones.findIndex(
      (m) => m.milestoneValue === milestoneValue
    );

    if (existingIndex > -1) {
      goal.milestones[existingIndex] = { milestoneValue, achievedAt, note };
    } else {
      goal.milestones.push({ milestoneValue, achievedAt, note });
    }

    const updatedGoal = await goal.save();
    devLog("Milestone updated for goal:", goalId);
    return res
      .status(200)
      .json({ message: "Milestone updated successfully", goal: updatedGoal });
  } catch (error) {
    devLog("Error updating milestone:", error.message);
    return res.status(500).json({
      message: "Unable to update milestone",
      error: isDev ? error.message : undefined,
    });
  }
};

// Eliminar una meta
exports.deleteGoal = async (req, res) => {
  try {
    const deletedGoal = await Goal.findByIdAndDelete(req.params.goalId);
    if (!deletedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    devLog("Deleted goal:", req.params.goalId);
    return res.status(204).send();
  } catch (error) {
    devLog("Error deleting goal:", error.message);
    return res.status(500).json({
      message: "Unable to delete goal",
      error: isDev ? error.message : undefined,
    });
  }
};
