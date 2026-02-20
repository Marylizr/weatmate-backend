const User = require("../models/userModel");

/**
 * Access rule for routes that target a specific user id in params.
 * - admin: can access any user
 * - personal-trainer: can access only clients assigned to them (user.trainerId === req.user._id)
 *   and also themselves
 * - basic: can access only themselves
 */
const canAccessUserByRole = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const targetUser = await User.findById(id).select("_id trainerId role");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admin bypass
    if (req.user.role === "admin") {
      req.targetUser = targetUser;
      return next();
    }

    // Self access
    if (String(targetUser._id) === String(req.user._id)) {
      req.targetUser = targetUser;
      return next();
    }

    // Trainer: only assigned clients
    if (req.user.role === "personal-trainer") {
      if (String(targetUser.trainerId) !== String(req.user._id)) {
        return res
          .status(403)
          .json({
            message: "Access denied. Client not assigned to this trainer.",
          });
      }

      req.targetUser = targetUser;
      return next();
    }

    // Basic users cannot access others
    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("canAccessUserByRole error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = canAccessUserByRole;
