const PreWorkout = require('../models/preWorkoutModel');

// Fetch all pre-designed workouts
exports.findAll = async (req, res) => {
  try {
    const workouts = await PreWorkout.find();
    res.status(200).json(workouts);
  } catch (error) {
    console.error("Error fetching workouts:", error.message);
    res.status(500).json({ error: "An error occurred while fetching workouts." });
  }
};

// Fetch a specific workout by ID
exports.findOne = async (req, res) => {
  try {
    const workout = await PreWorkout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found." });
    }
    res.status(200).json(workout);
  } catch (error) {
    console.error("Error fetching workout:", error.message);
    res.status(500).json({ error: "An error occurred while fetching the workout." });
  }
};

// Create a new pre-designed workout
exports.create = async (req, res) => {
  try {
    let payload = req.body;

    // Wrap single object payload in an array
    if (!Array.isArray(payload)) {
      console.log("Payload is not an array; wrapping it in an array.");
      payload = [payload];
    }

    // Validate payload
    payload.forEach((workout, index) => {
      if (!workout.name || !workout.infotype || !workout.content || !workout.subCategory) {
        console.log(`Workout at index ${index} is missing required fields:`, workout);
        throw new Error(`Workout at index ${index} is invalid.`);
      }
    });

    // Save workouts, skipping duplicates
    const newWorkouts = [];
    for (const workout of payload) {
      const exists = await PreWorkout.findOne({
        name: workout.name,
        infotype: workout.infotype,
        content: workout.content,
        subCategory: workout.subCategory,
      });

      if (exists) {
        console.log("Duplicate workout found, skipping:", workout);
        continue;
      }

      const newPreWorkout = new PreWorkout({
        name: workout.name,
        infotype: workout.infotype,
        content: workout.content,
        date: workout.date || new Date(),
        picture: workout.picture,
        subCategory: workout.subCategory,
      });

      const savedWorkout = await newPreWorkout.save();
      newWorkouts.push(savedWorkout);
    }

    console.log("Workouts created successfully:", newWorkouts);
    res.status(201).json({
      message: "Workouts created successfully.",
      data: newWorkouts,
    });
  } catch (error) {
    console.error("Error in /preWorkout create:", error.message);
    res.status(500).json({ error: "An error occurred while creating workouts." });
  }
};



// Update a specific workout by ID
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const updatedPreDesign = await PreWorkout.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true } // Return the updated document and validate updates
    );

    if (!updatedPreDesign) {
      return res.status(404).json({ error: "Workout not found." });
    }

    res.status(200).json({
      message: "Your workout has been updated successfully.",
      updatedPreDesign,
    });
  } catch (error) {
    console.error("Error updating workout:", error.message);
    res.status(500).json({ error: "An error occurred while updating the workout." });
  }
};

// Delete a specific workout by ID
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await PreWorkout.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "Workout not found." });
    }

    res.status(204).send(); // No content response
  } catch (error) {
    console.error("Error deleting workout:", error.message);
    res.status(500).json({ error: "An error occurred while deleting the workout." });
  }
};
