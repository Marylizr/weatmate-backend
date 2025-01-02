const express = require('express');
const GoalController = require('../controllers/GoalController');
const authenticateTrainer = require('../auth/authenticateTrainer');
const router = express.Router();

// Get all goals for a user
router.get('/:id', GoalController.getUserGoals);

// Add a new goal
router.post('/',  GoalController.createGoal);

// Update a goal's progress
router.put('/:goalId',  GoalController.updateGoalProgress);

// Delete a goal
router.delete('/:goalId', GoalController.deleteGoal);

module.exports = router;
