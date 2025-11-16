const Nutrition = require("../models/nutritionModel");

// === GET ALL ===
exports.findAll = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const role = req.user.role;

    let query = {};

    if (role === "admin") {
      // Admin: Everything
      query = {};
    } else if (role === "personal-trainer" || role === "trainer") {
      // Trainer: Own plans or general library
      query = {
        $or: [{ trainerId: currentUserId }, { isGeneral: true }],
      };
    } else {
      // Client: Assigned plans only
      query = { userId: currentUserId };
    }

    const plans = await Nutrition.find(query).sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching nutrition plans:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === GET ONE ===
exports.findOne = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const role = req.user.role;
    const plan = await Nutrition.findById(req.params.id);

    if (!plan)
      return res.status(404).json({ error: "Nutrition plan not found" });

    const isOwner = plan.trainerId.toString() === currentUserId.toString();
    const isAssigned = plan.userId?.toString() === currentUserId.toString();

    if (role !== "admin" && !isOwner && !isAssigned && !plan.isGeneral) {
      return res.status(403).json({ error: "Not allowed to view this plan" });
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
    let payload = req.body;

    if (!Array.isArray(payload)) {
      payload = [payload];
    }

    for (const plan of payload) {
      if (!plan.title || !plan.content) {
        return res.status(400).json({
          error: "Each plan must include both title and content",
        });
      }
    }

    const enriched = payload.map((plan) => ({
      ...plan,
      trainerId,
      userId: plan.userId || null,
      isGeneral: !!plan.isGeneral,
    }));

    const savedPlans = await Nutrition.insertMany(enriched);

    res.status(201).json({
      message: "Nutrition plan(s) created successfully",
      data: savedPlans,
    });
  } catch (error) {
    console.error("Error creating nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === UPDATE ===
exports.update = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const role = req.user.role;

    const planId = req.params.id || req.body._id;
    if (!planId) {
      return res.status(400).json({ error: "Missing plan id" });
    }

    const existing = await Nutrition.findById(planId);
    if (!existing) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    const isOwner = existing.trainerId.toString() === currentUserId.toString();
    if (!isOwner && role !== "admin") {
      return res
        .status(403)
        .json({ error: "You are not allowed to update this plan" });
    }

    const updateData = { ...req.body };
    delete updateData.trainerId;

    const updated = await Nutrition.findByIdAndUpdate(planId, updateData, {
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
    const currentUserId = req.user._id;
    const role = req.user.role;
    const { id } = req.params;

    const existing = await Nutrition.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    const isOwner = existing.trainerId.toString() === currentUserId.toString();

    if (!isOwner && role !== "admin") {
      return res.status(403).json({ error: "Not allowed to delete this plan" });
    }

    await Nutrition.findByIdAndDelete(id);

    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting nutrition plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
