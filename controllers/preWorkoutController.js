const PreWorkout = require("../models/preWorkoutModel");


exports.findAll = async (req, res) => {
  try {
    const { userId, start, end } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;

    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const plans = await PreWorkout.find(filter).sort({ date: 1 });
    res.status(200).json(plans);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unable to retrieve plans", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { userId, trainerId, planName, startDate, endDate, workouts } =
      req.body;

    if (!userId || !trainerId) {
      return res
        .status(400)
        .json({ message: "userId and trainerId are required" });
    }

    if (!Array.isArray(workouts) || workouts.length === 0) {
      return res.status(400).json({ message: "workouts[] is required" });
    }

    if (!startDate) {
      return res.status(400).json({ message: "startDate is required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate || startDate);

    const isValid = (d) => d instanceof Date && !Number.isNaN(d.getTime());
    if (!isValid(start) || !isValid(end)) {
      return res.status(400).json({ message: "Invalid startDate/endDate" });
    }

    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const docs = [];
    for (const day of dates) {
      for (const w of workouts) {
        docs.push({
          userId,
          trainerId,
          planName,
          startDate: start,
          endDate: end,
          date: day,
          picture: w.picture || "",
          content: w.content || "",
          subCategory: w.subCategory || "beginner",
          name: w.workoutId || "assigned-workout",
        });
      }
    }

    const saved = await PreWorkout.insertMany(docs);
    res.status(201).json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unable to create plan", error: err.message });
  }
};



// Obtener plan por ID
exports.findOne = async (req, res) => {
  try {
    const plan = await PreWorkout.findById(req.params.id)
      .populate("userId", "name email")
      .populate("trainerId", "name email");

    if (!plan) return res.status(404).json({ error: "Plan not found." });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Error fetching plan." });
  }
};

// Actualizar un plan
exports.update = async (req, res) => {
  try {
    const updated = await PreWorkout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Plan not found." });

    res.status(200).json({ message: "Plan updated.", data: updated });
  } catch (error) {
    res.status(500).json({ error: "Error updating plan." });
  }
};

// Eliminar un plan
exports.delete = async (req, res) => {
  try {
    const deleted = await PreWorkout.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Plan not found." });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error deleting plan." });
  }
};
