// const db = require('./mongo');
const SaveWork = require("../models/saveWorkoutModel");

exports.findAll = async (req, res) => {
  res.status(200).json(await SaveWork.find());
};

exports.delete = (req, res) => {
  const id = req.params.id;
  SaveWork.findByIdAndDelete(id, {}, (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else if (!result) {
      res.status(404);
    } else {
      res.status(204).send();
    }
  });
};

exports.findOne = async (req, res) => {
  res.status(200).json(await SaveWork.findOne(req.params.name));
};

exports.create = async (req, res) => {
  const data = req.body;
  const dataPosted = {
    name: data.name,
    type: data.type,
    workoutName: data.workoutName,
    description: data.description,
    reps: data.reps,
    lifted: data.lifted,
    date: data.date,
    series: data.series,
    picture: data.picture,
    video: data.video,
  };

  const newWorkout = new SaveWork(dataPosted);

  await newWorkout.save();
  console.log(newWorkout, "Your new Workout has been created");
  res.json({ Message: "Your new workout was created Succesfully", newWorkout });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedWorkout = await AddWork.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updatedWorkout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json({
      message: "Workout updated successfully",
      updatedWorkout,
    });
  } catch (error) {
    console.error("Error updating workout:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
