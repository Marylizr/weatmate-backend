const User = require("../models/userModel");
const ClientProfile = require("../models/ClientProfileModel");
// Admin: create a client profile and assign a trainer (1:1)
exports.createClientProfile = async (req, res) => {
  try {
    const {
      userId,
      assignedTrainerId,
      goal,
      fitnessLevel,
      tags,
      femaleProfile,
    } = req.body;

    if (!userId || !assignedTrainerId) {
      return res
        .status(400)
        .json({ message: "userId and assignedTrainerId are required" });
    }

    // Validate referenced users
    const [clientUser, trainerUser] = await Promise.all([
      User.findById(userId).select("_id role").lean(),
      User.findById(assignedTrainerId).select("_id role").lean(),
    ]);

    if (!clientUser) {
      return res.status(404).json({ message: "Client user not found" });
    }

    if (!trainerUser) {
      return res.status(404).json({ message: "Trainer user not found" });
    }

    if (
      trainerUser.role !== "personal-trainer" &&
      trainerUser.role !== "admin"
    ) {
      return res.status(400).json({
        message:
          "assignedTrainerId must belong to a personal-trainer (or admin)",
      });
    }

    const existing = await ClientProfile.findOne({ userId })
      .select("_id")
      .lean();
    if (existing) {
      return res
        .status(409)
        .json({ message: "ClientProfile already exists for this user" });
    }

    const profile = await ClientProfile.create({
      userId,
      assignedTrainerId,
      goal,
      fitnessLevel,
      tags: Array.isArray(tags) ? tags : [],
      femaleProfile: femaleProfile || undefined,
    });

    return res.status(201).json(profile);
  } catch (error) {
    console.error("createClientProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Trainer/Admin: list clients
// - trainer: only their assigned clients
// - admin: all, or filter by ?trainerId=
exports.listTrainerClients = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "personal-trainer") {
      query.assignedTrainerId = req.user._id;
    } else if (req.user.role === "admin") {
      if (req.query.trainerId) {
        query.assignedTrainerId = req.query.trainerId;
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const profiles = await ClientProfile.find(query)
      .populate(
        "userId",
        "name email image gender age height weight goal fitness_level"
      )
      .populate("assignedTrainerId", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(profiles);
  } catch (error) {
    console.error("listTrainerClients error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Trainer/Admin (ownership enforced by middleware): overview payload
exports.getClientOverview = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await ClientProfile.findById(id)
      .populate(
        "userId",
        "name email image gender age height weight goal fitness_level"
      )
      .populate("assignedTrainerId", "name email")
      .lean();

    if (!profile) {
      return res.status(404).json({ message: "ClientProfile not found" });
    }

    // NOTE: In later blocks we'll enrich overview with last check-in, last measurement, next event, etc.
    return res.json({
      clientProfile: profile,
    });
  } catch (error) {
    console.error("getClientOverview error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
