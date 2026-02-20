// routes/trainingPlanRouter.js
const express = require("express");
const trainingPlanRouter = express.Router();

const trainingPlanController = require("../controllers/trainingPlanController");
const {
  authMiddleware,
  IsAdmin,
  requireVerified,
} = require("../auth/authMiddleware");


const allowRoles = require("../auth/allowRoles");

// Trainer/Admin
trainingPlanRouter.post(
  "/training-plans",
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.create,
);

trainingPlanRouter.get(
  "/training-plans",
  allowRoles("admin", "personal-trainer", "basic"),
  trainingPlanController.list,
);

trainingPlanRouter.get(
  "/training-plans/:id",
  allowRoles("admin", "personal-trainer", "basic"),
  trainingPlanController.getById,
);

trainingPlanRouter.put(
  "/training-plans/:id",
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.update,
);

trainingPlanRouter.post(
  "/training-plans/:id/publish",
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.publish,
);

trainingPlanRouter.post(
  "/training-plans/:id/archive",
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.archive,
);

trainingPlanRouter.post(
  "/training-plans/:id/duplicate-week/:weekIndex",
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.duplicateWeek,
);

// Client endpoints (also allow admin for testing)
trainingPlanRouter.get(
  "/training-plans-active/today",
  allowRoles("admin", "basic"),
  trainingPlanController.getActiveToday,
);

trainingPlanRouter.get(
  "/training-plans-active/week",
  allowRoles("admin", "basic"),
  trainingPlanController.getActiveWeek,
);

// Dashboard trainer: snapshot cliente + plan semanal
trainingPlanRouter.get(
  "/dashboard/:clientId",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  trainingPlanController.getTrainerDashboard,
);

module.exports = trainingPlanRouter;
