const ClientProfile = require("../models/ClientProfileModel");

/**
 * Access rule:
 * - admin: can access any client profile
 * - personal-trainer: can access only profiles assigned to them
 */
const canAccessClientProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const profile = await ClientProfile.findById(id)
      .select("_id userId assignedTrainerId status")
      .lean();

    if (!profile) {
      return res.status(404).json({ message: "ClientProfile not found" });
    }

    if (req.user.role === "admin") {
      req.clientProfile = profile;
      return next();
    }

    if (req.user.role === "personal-trainer") {
      if (String(profile.assignedTrainerId) !== String(req.user._id)) {
        return res.status(403).json({
          message: "Access denied. Client not assigned to this trainer.",
        });
      }

      req.clientProfile = profile;
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("canAccessClientProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = canAccessClientProfile;
