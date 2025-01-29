const Fav = require('../models/favModel');

// Fetch all favorite workouts
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
  const data = req.body;
  try {
    const existingFav = await Fav.findOne({ name: data.name });
    if (existingFav) {
      return res.status(409).json({ message: "Workout already exists" });
    }

    const newFav = new Fav(data);
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

// Update an existing workout by ID
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
      message: "Your favorite workout has been updated successfully",
      data: updatedWorkout,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Delete a workout by ID
exports.delete = async (req, res) => {
  try {
    const result = await Fav.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
