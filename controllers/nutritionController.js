const Nutrition = require("../models/nutritionModel");

// === GET ALL ===
exports.findAll = async (req, res) => {
  try {
    const trainerId = req.user._id;

    const plans = await Nutrition.find({
      $or: [{ isGeneral: true }, { trainerId: trainerId }],
    }).sort({ createdAt: -1 });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching nutrition plans:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === GET ONE ===
exports.findOne = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const plan = await Nutrition.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    // security: only owner or general can view
    if (!plan.isGeneral && plan.trainerId.toString() !== trainerId.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this plan" });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error("Error fetching nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === CREATE ===
exports.create = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Missing required fields: title, content" });
    }

    const newPlan = new Nutrition({
      ...req.body,
      trainerId, // ALWAYS from token
      isGeneral: req.body.isGeneral || false,
    });

    await newPlan.save();

    res.status(201).json({
      message: "Nutrition plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    console.error("Error creating nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === UPDATE ===
exports.update = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { _id } = req.body;

    const existing = await Nutrition.findById(_id);

    if (!existing) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    // SECURITY: only owner can update
    if (existing.trainerId.toString() !== trainerId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not allowed to update this plan" });
    }

    const updated = await Nutrition.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Nutrition plan updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === DELETE ===
exports.delete = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { id } = req.params;

    const existing = await Nutrition.findById(id);

    if (!existing) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    // SECURITY: only owner can delete
    if (existing.trainerId.toString() !== trainerId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not allowed to delete this plan" });
    }

    await Nutrition.findByIdAndDelete(id);

    res.status(200).json({ message: "Nutrition plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
