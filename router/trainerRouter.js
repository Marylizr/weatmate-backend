const express = require("express");
const clientProfileController = require("../controllers/clientProfileController");
const trainerController = require("../controllers/trainerController");
const { authMiddleware, requireVerified } = require("../auth/authMiddleware");
const allowRoles = require("../auth/allowRoles");

const trainerRouter = express.Router();

// Trainer/Admin: list clients for ClientHub
// - trainer: only assigned clients
// - admin: all clients or filter by ?trainerId=
trainerRouter.get(
  "/clients",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  clientProfileController.listTrainerClients,
);

// Trainer: create a client (basic) assigned to themselves
trainerRouter.post(
  "/clients/signup",
  authMiddleware,
  requireVerified,
  allowRoles("personal-trainer"),
  trainerController.trainerCreateClient,
);

module.exports = trainerRouter;
