const express = require("express");
const clientProfileController = require("../controllers/clientProfileController");
const { authMiddleware, requireVerified } = require("../auth/authMiddleware");
const  allowRoles  = require("../auth/allowRoles");
const canAccessClientProfile = require("../auth/canAccessClientProfile");

const clientProfileRouter = express.Router();

// Admin: create client profile (assign trainer)
clientProfileRouter.post(
  "/",
  authMiddleware,
  requireVerified,
  allowRoles("admin"),
  clientProfileController.createClientProfile
);

// Trainer/Admin: overview for ClientHub (ownership enforced)
clientProfileRouter.get(
  "/:id/overview",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessClientProfile,
  clientProfileController.getClientOverview
);

module.exports = clientProfileRouter;
