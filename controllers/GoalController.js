const Goal = require("../models/GoalModel");

//  Get User Goals
exports.getUserGoals = async (req, res) => {
  const { id } = req.query; // frontend envía ?id=${user._id}

  if (!id) {
    return res.status(400).json({ message: "Missing userId parameter" });
  }

  try {
    const goals = await Goal.find({ userId: id });
    return res.status(200).json(goals);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve goals",
      error: error.message,
    });
  }
};

//  Create New Goal
exports.createGoal = async (req, res) => {
  const {
    userId,
    goalType,
    targetValue,
    currentValue,
    milestones,
    personalNotes,
    measure,
  } = req.body;

  if (!userId || !goalType || targetValue === undefined || !measure) {
    return res.status(400).json({
      message: "Missing required fields",
      received: req.body,
    });
  }

  try {
    const newGoal = await Goal.create({
      userId,
      goalType,
      targetValue,
      currentValue: currentValue || 0,
      measure,
      milestones: milestones || [],
      personalNotes: personalNotes || [],
    });

    res.status(201).json({
      message: "Goal created successfully",
      goal: newGoal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create goal",
      error: error.message,
    });
  }
};

//  Update Progress
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

    // auto-mark if reached
    if (currentValue >= goal.targetValue) {
      goal.milestones.push({
        milestoneValue: goal.targetValue,
        achievedAt: new Date(),
      });
    }

    const updatedGoal = await goal.save();
    res.status(200).json({
      message: "Goal progress updated",
      goal: updatedGoal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update goal progress",
      error: error.message,
    });
  }
};

//  Update Milestone
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

    const existing = goal.milestones.findIndex(
      (m) => m.milestoneValue === milestoneValue
    );

    if (existing > -1) {
      goal.milestones[existing] = { milestoneValue, achievedAt, note };
    } else {
      goal.milestones.push({ milestoneValue, achievedAt, note });
    }

    const updatedGoal = await goal.save();
    res.status(200).json({
      message: "Milestone updated successfully",
      goal: updatedGoal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update milestone",
      error: error.message,
    });
  }
};

//  Delete Goal
exports.deleteGoal = async (req, res) => {
  try {
    const result = await Goal.findByIdAndDelete(req.params.goalId);
    if (!result) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete goal",
      error: error.message,
    });
  }
};
