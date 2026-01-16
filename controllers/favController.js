// controllers/favController.js
const Fav = require("../models/favModel");

// ===============================
// GET ALL WORKOUT SESSIONS
// ===============================
exports.findAll = async (req, res) => {
  try {
    const favs = await Fav.find().sort({ date: -1 });

    res.status(200).json({
      status: "success",
      data: favs,
    });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ===============================
// GET ONE WORKOUT SESSION
// ===============================
exports.findOne = async (req, res) => {
  try {
    const fav = await Fav.findById(req.params.id);

    if (!fav) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.status(200).json({
      status: "success",
      data: fav,
    });
  } catch (error) {
    console.error("Error fetching workout:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ===============================
// CREATE A NEW WORKOUT SESSION
// ===============================
exports.create = async (req, res) => {
  const { workoutName, date } = req.body;

  try {
    if (!workoutName || !date) {
      return res.status(400).json({
        status: "error",
        message: "workoutName and date are required",
      });
    }

    // Ensure only one session exists per (workoutName + date)
    const existing = await Fav.findOne({ workoutName, date });

    if (existing) {
      return res.status(200).json({
        status: "exists",
        message: "Session already exists. You may add rounds.",
        data: existing,
      });
    }

    const newFav = new Fav(req.body);
    await newFav.save();

    res.status(201).json({
      status: "success",
      message: "Workout session created",
      data: newFav,
    });
  } catch (error) {
    console.error("Error creating workout:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ===============================
// ADD A ROUND TO EXISTING SESSION
// ===============================
// PATCH /fav/add-round/:workoutName
exports.addRound = async (req, res) => {
  try {
    const encodedName = req.params.workoutName;
    const workoutName = decodeURIComponent(encodedName);

    const { round, date } = req.body;

    if (!round) {
      return res
        .status(400)
        .json({ status: "error", message: "Round is required" });
    }

    if (!date) {
      return res.status(400).json({
        status: "error",
        message: "Date is required to identify the workout session",
      });
    }

    // Find the correct session by workoutName + date
    const session = await Fav.findOne({ workoutName, date });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Workout session not found for this date",
      });
    }

    session.rounds.push(round);
    await session.save();

    res.status(200).json({
      status: "success",
      message: "Round added successfully",
      data: session,
    });
  } catch (error) {
    console.error("Error adding round:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ===============================
// UPDATE WORKOUT SESSION
// ===============================
exports.update = async (req, res) => {
  try {
    const updated = await Fav.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Workout updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating workout:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ===============================
// DELETE WORKOUT SESSION
// ===============================
exports.delete = async (req, res) => {
  try {
    const removed = await Fav.findByIdAndDelete(req.params.id);

    if (!removed) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting workout:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
