// controllers/nutritionController.js
const Nutrition = require("../models/nutritionModel");

// === GET ALL ===
// Devuelve planes según el rol:
// - admin: todo
// - personal-trainer / trainer: sus planes + biblioteca general
// - cliente: solo los planes asignados a él (userId == req.user._id)
exports.findAll = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const role = req.user.role;

    let query = {};

    if (role === "admin") {
      // Admin ve todo
      query = {};
    } else if (role === "personal-trainer" || role === "trainer") {
      // Trainer ve sus planes (templates, asignados, generales que haya creado)
      // + biblioteca general creada por otros (isGeneral: true)
      query = {
        $or: [{ trainerId: currentUserId }, { isGeneral: true }],
      };
    } else {
      // Cliente / usuario normal: solo lo que le asignaron
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
// Solo puede verlo:
// - admin
// - su creador (trainerId)
// - el usuario al que fue asignado (userId)
exports.findOne = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const role = req.user.role;
    const plan = await Nutrition.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    const isOwner = plan.trainerId.toString() === currentUserId.toString();
    const isAssignedUser =
      plan.userId && plan.userId.toString() === currentUserId.toString();

    if (role !== "admin" && !isOwner && !isAssignedUser && !plan.isGeneral) {
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
// controllers/nutritionController.js
exports.create = async (req, res) => {
  try {
    const trainerId = req.user._id;

    let payload = req.body;

    // Si el payload no es un array, lo convertimos
    if (!Array.isArray(payload)) {
      payload = [payload];
    }

    // Validar todos los items (title + content obligatorios)
    for (const plan of payload) {
      if (!plan.title || !plan.content) {
        return res.status(400).json({
          error: "Each plan must include both title and content",
        });
      }
    }

    // Incluir trainerId y userId (si no existe)
    const enrichedPayload = payload.map((plan) => ({
      ...plan,
      trainerId, // Siempre inyectado desde token
      userId: plan.userId || null, // Solo si se asigna a un usuario
      isGeneral: !!plan.isGeneral,
    }));

    // insertMany para manejar lote
    const savedPlans = await Nutrition.insertMany(enrichedPayload);

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
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ error: "Missing plan _id in body" });
    }

    const existing = await Nutrition.findById(_id);

    if (!existing) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    const isOwner = existing.trainerId.toString() === currentUserId.toString();

    if (!isOwner && role !== "admin") {
      return res
        .status(403)
        .json({ error: "You are not allowed to update this plan" });
    }

    // No permitimos cambiar trainerId desde el body
    const updateData = { ...req.body };
    delete updateData.trainerId;

    const updated = await Nutrition.findByIdAndUpdate(_id, updateData, {
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
