const SaveWork = require("../models/saveWorkoutModel");
const mongoose = require("mongoose");

// ==============================
// FIND ALL (SAFE)
// ==============================
exports.findAll = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let query = {};

    if (role === "admin") {
      // Admin ve todo
      query = {};
    } else if (role === "personal-trainer") {
      // Trainer → solo sus clientes (si quieres ampliar esto luego)
      query = { userId };
    } else {
      // Usuario normal → solo sus workouts
      query = { userId };
    }

    const workouts = await SaveWork.find(query).sort({ date: -1 });

    return res.status(200).json(workouts);
  } catch (err) {
    console.error("Error in findAll:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==============================
// FIND ONE (SECURE)
// ==============================
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await SaveWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 🔒 CONTROL DE ACCESO
    if (role !== "admin" && workout.userId?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(workout);
  } catch (err) {
    console.error("Error in findOne:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==============================
// CREATE (SECURE)
// ==============================
exports.create = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      type,
      workoutName,
      description,
      reps,
      lifted,
      series,
      picture,
      video,
    } = req.body;

    // 🔒 VALIDACIÓN MÍNIMA
    if (!workoutName) {
      return res.status(400).json({
        message: "workoutName is required",
      });
    }

    const newWorkout = new SaveWork({
      userId, // 🔥 SIEMPRE desde token
      name: name || "",
      type: type || "",
      workoutName,
      description: description || "",
      reps: reps || null,
      lifted: lifted || null,
      series: series || null,
      picture: picture || "",
      video: video || "",
      date: new Date(),
    });

    await newWorkout.save();

    return res.status(201).json({
      message: "Workout created successfully",
      newWorkout,
    });
  } catch (err) {
    console.error("Error in create:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==============================
// UPDATE (SECURE)
// ==============================
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await SaveWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 🔒 CONTROL DE ACCESO
    if (role !== "admin" && workout.userId?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedWorkout = await SaveWork.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(200).json({
      message: "Workout updated successfully",
      updatedWorkout,
    });
  } catch (err) {
    console.error("Error in update:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==============================
// DELETE (SECURE)
// ==============================
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid workout ID" });
    }

    const workout = await SaveWork.findById(id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 🔒 CONTROL DE ACCESO
    if (role !== "admin" && workout.userId?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await workout.deleteOne();

    return res.status(200).json({
      message: "Workout deleted successfully",
    });
  } catch (err) {
    console.error("Error in delete:", err);
    return res.status(500).json({ error: err.message });
  }
};
