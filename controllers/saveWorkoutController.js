const SaveWork = require("../models/saveWorkoutModel");
const mongoose = require("mongoose");

// ========== FIND ALL ==========
exports.findAll = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || userId === "undefined") {
      return res.status(200).json([]);
    }

    const workouts = await SaveWork.find({ userId }).sort({ date: -1 });
    return res.status(200).json(workouts);
  } catch (err) {
    console.error("Error in findAll:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ========== FIND ONE BY ID ==========
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await SaveWork.findById(id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    return res.status(200).json(workout);
  } catch (err) {
    console.error("Error in findOne:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ========== CREATE WORKOUT ==========
exports.create = async (req, res) => {
  try {
    const data = req.body;

    const dataPosted = {
      userId: data.userId,
      name: data.name,
      type: data.type,
      workoutName: data.workoutName,
      description: data.description,
      reps: data.reps,
      lifted: data.lifted,
      date: data.date || new Date(),
      series: data.series,
      picture: data.picture,
      video: data.video,
    };

    const newWorkout = new SaveWork(dataPosted);
    await newWorkout.save();

    console.log("Workout created:", newWorkout);
    return res.status(201).json({
      message: "Your new workout was created successfully",
      newWorkout,
    });
  } catch (err) {
    console.error("Error in create:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ========== UPDATE WORKOUT ==========
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const data = req.body;

    const updatedWorkout = await SaveWork.findByIdAndUpdate(id, data, {
      new: true,
    });

    if (!updatedWorkout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    return res.status(200).json({
      message: "Your workout has been updated successfully",
      updatedWorkout,
    });
  } catch (err) {
    console.error("Error in update:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ========== DELETE WORKOUT ==========
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Validación nueva — evita 500 por CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const result = await SaveWork.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Workout not found" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Error in delete:", err);
    return res.status(500).json({ error: err.message });
  }
};
