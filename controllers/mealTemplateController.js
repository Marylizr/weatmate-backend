const MealTemplate = require("../models/MealTemplate");

exports.createTemplate = async (req, res) => {
  try {
    console.log("BODY RAW:", req.body);

    const body = req.body || {};

    const name = body.name;
    const foods = body.foods;
    const totalMacros = body.totalMacros;

    if (!name) {
      return res.status(400).json({ msg: "Missing name" });
    }

    if (!Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ msg: "Foods invalid or empty" });
    }

    const template = await MealTemplate.create({
      name,
      foods,
      totalMacros,
      userId: req.user.id,
    });

    return res.status(201).json({
      message: "Template created successfully",
      template,
    });
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await MealTemplate.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json(templates);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await MealTemplate.findByIdAndDelete(req.params.id);

    return res.json({ message: "Template deleted" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
