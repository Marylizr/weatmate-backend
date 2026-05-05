const express = require("express");
const progressController = require("../controllers/progressController");
const { authMiddleware } = require("../auth/authMiddleware");
const allowRoles = require("../auth/allowRoles");

const progressRouter = express.Router();

progressRouter.use(authMiddleware);

// GET all progress entries
// Supports:
// /progress
// /progress?userId=...
// /progress?userId=...&from=2026-01-01&to=2026-12-31
// /progress?userId=...&page=1&limit=20
progressRouter.get(
  "/",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.findAll,
);

// GET one
progressRouter.get(
  "/:id",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.findOne,
);

// CREATE
progressRouter.post(
  "/",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.create,
);

// UPDATE
progressRouter.patch(
  "/:id",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.update,
);

progressRouter.put(
  "/:id",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.update,
);

// DELETE
progressRouter.delete(
  "/:id",
  allowRoles("admin", "personal-trainer", "client", "basic"),
  progressController.delete,
);

module.exports = progressRouter;
