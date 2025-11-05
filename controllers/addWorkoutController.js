const AddWork = require("../models/addWorkoutModel");

// GET all
exports.findAll = async (req, res) => {
  try {
    const workouts = await AddWork.find();
    res.status(200).json(workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET by ID
exports.findOne = async (req, res) => {
  try {
    const workout = await AddWork.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.status(200).json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create
exports.create = async (req, res) => {
  try {
    const data = req.body;
    const dataPosted = {
      type: data.type,
      workoutName: data.workoutName,
      description: data.description,
      reps: data.reps,
      series: data.series,
      lifted: data.lifted || 0,
      picture: data.picture,
      video: data.video,
    };

    const newWorkout = new AddWork(dataPosted);
    await newWorkout.save();

    console.log("Created new Workout:", newWorkout);
    res.status(201).json({
      message: "Workout created successfully",
      newWorkout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await AddWork.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "Workout not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const updatedWorkout = await AddWork.findByIdAndUpdate(id, data, {
      new: true,
    });

    if (!updatedWorkout)
      return res.status(404).json({ message: "Workout not found" });

    res.status(200).json({
      message: "Workout updated successfully",
      updatedWorkout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
