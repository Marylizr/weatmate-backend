const express = require("express");
const goalController = require("../controllers/GoalController");
const { authMiddleware } = require("../auth/authMiddleware");
const goalRouter = express.Router();

// Get all goals for a user
goalRouter.get("/", goalController.getUserGoals);

// Add a new goal
goalRouter.post("/", authMiddleware, goalController.createGoal);

// Update milestones or progress
goalRouter.put(
  "/:goalId/milestones",
  authMiddleware,
  goalController.updateGoalMilestone
);
goalRouter.put(
  "/:goalId/progress",
  authMiddleware,
  goalController.updateGoalProgress
);

// Delete goal
goalRouter.delete("/:goalId", authMiddleware, goalController.deleteGoal);

module.exports = goalRouter;
