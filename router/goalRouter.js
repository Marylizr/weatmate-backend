const express = require("express");
const goalController = require("../controllers/GoalController");
const authenticateTrainer = require("../auth/authenticateTrainer");
const goalRouter = express.Router();

// Get all goals for a user
goalRouter.get("/", goalController.getUserGoals);

// Add a new goal
goalRouter.post("/", authenticateTrainer, goalController.createGoal);

// Update milestones or progress
goalRouter.put(
  "/:goalId/milestones",
  authenticateTrainer,
  goalController.updateGoalMilestone
);
goalRouter.put(
  "/:goalId/progress",
  authenticateTrainer,
  goalController.updateGoalProgress
);

// Delete goal
goalRouter.delete("/:goalId", authenticateTrainer, goalController.deleteGoal);

module.exports = goalRouter;
