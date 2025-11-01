// const db = require('./mongo');
const AddWork = require("../models/addWorkoutModel");

exports.findAll = async (req, res) => {
  res.status(200).json(await AddWork.find());
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const deleted = await AddWork.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Workout not found" });
    }

    return res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.findOne = async (req, res) => {
  res.status(200).json(await AddWork.findOne(req.params.name));
};

exports.create = async (req, res) => {
  const data = req.body;

  const dataPosted = {
    type: data.type,
    workoutName: data.workoutName,
    description: data.description,
    reps: data.reps,
    series: data.series,
    lifted: data.lifted,
    picture: data.picture,
    video: data.video,
  };

  try {
    const newWorkout = new AddWork(dataPosted);
    await newWorkout.save();
    console.log("Creating new Workout:", newWorkout);
    res
      .status(201)
      .json({ message: "Workout created successfully", newWorkout });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const updatedWorkout = await AddWork.findByIdAndUpdate(id, data, {
      new: true,
    });

    if (!updatedWorkout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    res
      .status(200)
      .json({ message: "Workout updated successfully", updatedWorkout });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
