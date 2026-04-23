const express = require("express");
const nutritionPlanRouter = express.Router();
const nutritionPlanController = require("../controllers/nutritionPlanController");
const { authMiddleware } = require("../auth/authMiddleware");

// Middleware (ajústalo si tu ruta es distinta)
const allowRoles = require("../auth/allowRoles");

// =============================
// CREATE PLAN (trainer)
// =============================
nutritionPlanRouter.post(
  "/",
  authMiddleware,
  allowRoles("personal-trainer", "admin"),
  nutritionPlanController.createPlan,
);

// =============================
// GET PLANS BY USER
// =============================
nutritionPlanRouter.get(
  "/:userId",
  authMiddleware,
  allowRoles("personal-trainer", "admin"),
  nutritionPlanController.getPlanByUser,
);

// =============================
// UPDATE PLAN
// =============================
nutritionPlanRouter.patch(
  "/:id",
  authMiddleware,
  allowRoles("personal-trainer", "admin"),
  nutritionPlanController.updatePlan,
);

// =============================
// DELETE PLAN
// =============================
nutritionPlanRouter.delete(
  "/:id",
  authMiddleware,
  allowRoles("personal-trainer", "admin"),
  nutritionPlanController.deletePlan,
);

module.exports = nutritionPlanRouter;
