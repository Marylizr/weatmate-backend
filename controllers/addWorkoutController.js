const AddWork = require("../models/addWorkoutModel");
const mongoose = require("mongoose");

// ==============================
// GET ALL (CORE FIX)
// ==============================
exports.findAll = async (req, res) => {
  try {
    const userId = req.user._id;

    const workouts = await AddWork.find({
      $or: [
        { isGeneral: true }, // biblioteca global
        { trainerId: userId }, // propios
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workouts", error });
  }
};

// ==============================
// GET ONE
// ==============================
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await AddWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 🔒 seguridad
    if (
      !workout.isGeneral &&
      workout.trainerId?.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(workout);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workout", error });
  }
};

// ==============================
// CREATE (FIX IMPORTANTE)
// ==============================
exports.create = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      type,
      subType,
      workoutName,
      description,
      reps,
      series,
      picture,
      video,
      workoutLevel,
      isGeneral,
    } = req.body;

    const newWorkout = new AddWork({
      type,
      subType,
      workoutName,
      description,
      reps,
      series,
      picture,
      video,
      workoutLevel,
      trainerId: userId, // 🔥 SIEMPRE backend
      isGeneral,
    });

    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error) {
    res.status(400).json({ message: "Failed to create workout", error });
  }
};

// ==============================
// UPDATE
// ==============================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const workout = await AddWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    if (
      workout.trainerId?.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this workout" });
    }

    const updatedWorkout = await AddWork.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).json(updatedWorkout);
  } catch (error) {
    res.status(500).json({ message: "Failed to update workout", error });
  }
};

// ==============================
// DELETE
// ==============================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await AddWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    if (
      workout.trainerId?.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this workout" });
    }

    await workout.deleteOne();

    return res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete workout", error: error.message });
  }
};
