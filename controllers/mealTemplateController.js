const MealTemplate = require("../models/MealTemplate");


exports.createTemplate = async (req, res) => {
  try {
    const { name, meals } = req.body;

    if (!name || !meals) {
      return res.status(400).json({ msg: "Missing data" });
    }

    const template = await MealTemplate.create({
      name,
      meals,
      userId: req.user.id,
    });

    return res.status(201).json({
      message: "Template created successfully",
      template,
    });
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ msg: "Server error" });
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
