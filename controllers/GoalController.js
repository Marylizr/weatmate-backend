const Goal = require('../models/GoalModel');

exports.getUserGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.params.id });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve goals', error: error.message });
  }
};

exports.createGoal = async (req, res) => {
  const { id, goalType, targetValue, currentValue, milestones, personalNotes } = req.body;

  if (!id || !goalType || targetValue === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newGoal = await Goal.create({
      id,
      goalType,
      targetValue,
      currentValue: currentValue || 0,
      milestones: milestones || [],
      personalNotes: personalNotes || []
    });

    res.status(201).json({ message: 'Goal created successfully', goal: newGoal });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create goal', error: error.message });
  }
};

exports.updateGoalProgress = async (req, res) => {
  const { goalId } = req.params;
  const { currentValue } = req.body;

  try {
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.currentValue = currentValue;
    goal.progressHistory.push({ value: currentValue });
    if (currentValue >= goal.targetValue) {
      goal.milestones.push({ milestoneValue: goal.targetValue, achievedAt: new Date() });
    }

    const updatedGoal = await goal.save();
    res.status(200).json({ message: 'Goal progress updated', goal: updatedGoal });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update goal progress', error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const result = await Goal.findByIdAndDelete(req.params.goalId);
    if (!result) return res.status(404).json({ message: 'Goal not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete goal', error: error.message });
  }
};

exports.addMilestone = async (req, res) => {
  const { id, milestoneValue } = req.body;

  try {
    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Add the milestone with the current date
    const newMilestone = {
      milestoneValue,
      achievedAt: new Date(), // Add the current date here
    };

    goal.milestones.push(newMilestone);
    await goal.save();

    res.status(200).json({ message: 'Milestone added successfully', goal });
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ message: 'Error adding milestone', error: error.message });
  }
};