const Fav = require("../models/favModel");

// Fetch all workouts
exports.findAll = async (req, res) => {
  try {
    const favs = await Fav.find();
    if (favs.length === 0) {
      return res.status(200).json({ message: "No workouts found", data: favs });
    }
    res.status(200).json({ status: "success", data: favs });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Fetch a single workout by ID
exports.findOne = async (req, res) => {
  try {
    const fav = await Fav.findById(req.params.id);
    if (!fav) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json({ status: "success", data: fav });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Create a new favorite workout
exports.create = async (req, res) => {
  const { workoutName, date } = req.body;

  try {
    // Check if a workout with the same name and date already exists
    const existingFav = await Fav.findOne({ workoutName, date });

    if (existingFav) {
      // Instead of error, return the existing workout to allow PATCH later
      return res.status(200).json({
        status: "exists",
        message: "Workout already exists, you can add rounds.",
        data: existingFav,
      });
    }

    // Create and save the new workout
    const newFav = new Fav(req.body);
    await newFav.save();

    res.status(201).json({
      status: "success",
      message: "Your new favorite workout was created successfully",
      data: newFav,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Add a new round to an existing workout (PATCH /fav/add-round/:workoutName)
exports.addRound = async (req, res) => {
  try {
    const { workoutName } = req.params;
    const { round } = req.body;

    if (!round) {
      return res.status(400).json({ message: "Round data is required" });
    }

    const existingWorkout = await Fav.findOne({ workoutName });
    if (!existingWorkout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    existingWorkout.rounds.push(round);
    await existingWorkout.save();

    res.status(200).json({
      status: "success",
      message: "Round added successfully",
      data: existingWorkout,
    });
  } catch (error) {
    console.error("Error adding round:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Update a workout by ID
exports.update = async (req, res) => {
  try {
    const updatedWorkout = await Fav.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedWorkout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json({
      status: "success",
      message: "Workout updated successfully",
      data: updatedWorkout,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Delete a workout
exports.delete = async (req, res) => {
  try {
    const result = await Fav.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
