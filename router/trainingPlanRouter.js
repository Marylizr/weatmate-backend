// routes/trainingPlanRouter.js
const express = require("express");
const trainingPlanRouter = express.Router();

const trainingPlanController = require("../controllers/trainingPlanController");
const { authMiddleware } = require("../auth/authMiddleware");

const allowRoles = require("../auth/allowRoles");

// Trainer/Admin
trainingPlanRouter.post(
  "/training-plans",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.create,
);

trainingPlanRouter.get(
  "/training-plans",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  trainingPlanController.list,
);

trainingPlanRouter.get(
  "/training-plans/:id",
  authMiddleware,
  allowRoles("admin", "personal-trainer", "basic"),
  trainingPlanController.getById,
);

trainingPlanRouter.put(
  "/training-plans/:id",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.update,
);

trainingPlanRouter.post(
  "/training-plans/:id/publish",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.publish,
);

trainingPlanRouter.post(
  "/training-plans/:id/archive",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.archive,
);

trainingPlanRouter.post(
  "/training-plans/:id/duplicate-week/:weekIndex",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.duplicateWeek,
);

// Client endpoints
trainingPlanRouter.get(
  "/training-plans-active/today",
  authMiddleware,
  allowRoles("admin", "basic"),
  trainingPlanController.getActiveToday,
);

trainingPlanRouter.get(
  "/training-plans-active/week",
  authMiddleware,
  allowRoles("admin", "basic"),
  trainingPlanController.getActiveWeek,
);

// Dashboard trainer
trainingPlanRouter.get(
  "/dashboard/:clientId",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.getTrainerDashboard,
);

module.exports = trainingPlanRouter;
