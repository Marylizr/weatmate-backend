const express = require('express');
const GoalController = require('../controllers/GoalController');
const authenticateTrainer = require('../auth/authenticateTrainer');
const GoalRouter = express.Router();

// Get all goals for a user
GoalRouter.get('/', GoalController.getUserGoals);

// Add a new goal
GoalRouter.post('/', authenticateTrainer, GoalController.createGoal);

// Update a goal's progress

GoalRouter.put('/:goalId/milestones', authenticateTrainer, GoalController.updateGoalMilestone);
GoalRouter.put('/:goalId/progress', authenticateTrainer, GoalController.updateGoalProgress);



// Delete a goal
GoalRouter.delete('/:goalId', authenticateTrainer, GoalController.deleteGoal);

module.exports = GoalRouter;
