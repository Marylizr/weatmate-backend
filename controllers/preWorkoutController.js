const PreWorkout = require("../models/preWorkoutModel");

// Crear una nueva rutina asignada
exports.create = async (req, res) => {
  try {
    let payload = req.body;

    // Si viene un solo plan, lo envolvemos en array
    if (!Array.isArray(payload)) {
      payload = [payload];
    }

    const savedPlans = [];

    for (const plan of payload) {
      // Si el payload contiene una lista de workouts, es un plan nuevo
      if (plan.workouts && Array.isArray(plan.workouts)) {
        for (const workout of plan.workouts) {
          const newWorkout = new PreWorkout({
            name: plan.planName || plan.name || "Unnamed Plan",
            infotype: "workouts",
            subCategory: workout.subCategory || "basic",
            date: plan.startDate || new Date(),
            picture: workout.picture || "",
            content: workout.content || "No content provided",
          });

          const saved = await newWorkout.save();
          savedPlans.push(saved);
        }
      } else {
        // Caso antiguo (payload directo tipo workout)
        if (
          !plan.name ||
          !plan.infotype ||
          !plan.content ||
          !plan.subCategory
        ) {
          throw new Error(`Invalid workout data: ${JSON.stringify(plan)}`);
        }

        const exists = await PreWorkout.findOne({
          name: plan.name,
          infotype: plan.infotype,
          content: plan.content,
          subCategory: plan.subCategory,
        });

        if (exists) continue;

        const newPreWorkout = new PreWorkout({
          name: plan.name,
          infotype: plan.infotype,
          subCategory: plan.subCategory,
          date: plan.date || new Date(),
          picture: plan.picture,
          content: plan.content,
        });

        const saved = await newPreWorkout.save();
        savedPlans.push(saved);
      }
    }

    res.status(201).json({
      message: "Workout(s) saved successfully.",
      data: savedPlans,
    });
  } catch (error) {
    console.error("Error in /preWorkout create:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while creating preWorkouts." });
  }
};

// Obtener todos los planes
exports.findAll = async (req, res) => {
  try {
    const plans = await PreWorkout.find()
      .populate("userId", "name email")
      .populate("trainerId", "name email");
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: "Error fetching preworkouts." });
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
