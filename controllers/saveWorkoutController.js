const SaveWork = require("../models/saveWorkoutModel");

// Get all workouts for a user
exports.findAll = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const workouts = await SaveWork.find({ userId }).sort({ order: 1 });

  res.status(200).json(workouts);
};

// Create a workout (only if not exists)
exports.create = async (req, res) => {
  const data = req.body;

  if (!data.userId)
    return res.status(400).json({ error: "userId is required" });

  // Prevent duplicates by name + user
  const exists = await SaveWork.findOne({
    userId: data.userId,
    workoutName: data.workoutName,
  });

  if (exists) {
    return res.status(200).json({
      status: "exists",
      message: "Workout already registered for this user",
      workout: exists,
    });
  }

  // Create new workout
  const newWorkout = new SaveWork({
    ...data,
    rounds: data.rounds || [],
    order: data.order || 0,
  });

  await newWorkout.save();

  res.status(201).json({
    message: "Workout created successfully",
    workout: newWorkout,
  });
};

// Add round to existing workout
exports.addRound = async (req, res) => {
  const { workoutId } = req.params;
  const { round } = req.body;

  const workout = await SaveWork.findById(workoutId);
  if (!workout) return res.status(404).json({ error: "Workout not found" });

  workout.rounds.push(round);
  await workout.save();

  res.status(200).json({ message: "Round added", workout });
};

// Save complete session in history
exports.saveSession = async (req, res) => {
  const { workoutId } = req.params;
  const { rounds, date } = req.body;

  const workout = await SaveWork.findById(workoutId);
  if (!workout) return res.status(404).json({ error: "Workout not found" });

  workout.sessionHistory.push({
    date: date || new Date(),
    rounds,
  });

  // clear today's temporary rounds
  workout.rounds = [];

  await workout.save();

  res.status(200).json({ message: "Session saved", workout });
};

// Update order of workouts
exports.reorder = async (req, res) => {
  const { userId, newOrder } = req.body;

  if (!userId || !newOrder)
    return res.status(400).json({ error: "userId and newOrder required" });

  for (let item of newOrder) {
    await SaveWork.findByIdAndUpdate(item._id, { order: item.order });
  }

  res.status(200).json({ message: "Order updated" });
};

// Delete workout
exports.delete = async (req, res) => {
  const { id } = req.params;

  await SaveWork.findByIdAndDelete(id);
  res.status(204).send();
};
