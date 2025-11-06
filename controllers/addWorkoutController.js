// controllers/addWorkoutController.js

const AddWork = require("../models/addWorkoutModel");
const mongoose = require("mongoose");

// GET all workouts
exports.findAll = async (req, res) => {
  try {
    const workouts = await AddWork.find();
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workouts", error });
  }
};

// GET one workout by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }
    const workout = await AddWork.findById(id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json(workout);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workout", error });
  }
};

// CREATE workout
exports.create = async (req, res) => {
  try {
    const {
      type,
      workoutName,
      description,
      reps,
      series,
      lifted,
      picture,
      video,
      workoutLevel,
      trainerId,
      isGeneral,
    } = req.body;

    const newWorkout = new AddWork({
      type,
      workoutName,
      description,
      reps,
      series,
      lifted: lifted || 0,
      picture,
      video,
      workoutLevel,
      trainerId: trainerId,
      isGeneral: isGeneral || false,
    });

    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error) {
    res.status(400).json({ message: "Failed to create workout", error });
  }
};

// UPDATE workout (only creator or admin can update)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?._id;
    const userRole = req.user?.role;

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

// DELETE workout (only creator or admin can delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await AddWork.findById(id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // Verifica si hay usuario autenticado
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId && !userRole) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not authenticated" });
    }

    // Solo el creador o un admin puede eliminar
    if (
      workout.trainerId?.toString() !== userId?.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this workout" });
    }

    await workout.deleteOne();
    return res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.error(" Error deleting workout:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete workout", error: error.message });
  }
};
