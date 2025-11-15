const express = require("express");
const nutritionController = require("../controllers/nutritionController");
const { authMiddleware } = require("../auth/authMiddleware");
const nutritionRouter = express.Router();

// GET all nutrition plans (only allowed plans)
nutritionRouter.get("/", authMiddleware, nutritionController.findAll);

// GET one by ID
nutritionRouter.get("/:id", authMiddleware, nutritionController.findOne);

// CREATE a new nutrition plan
nutritionRouter.post("/", authMiddleware, nutritionController.create);

// DELETE a plan
nutritionRouter.delete("/:id", authMiddleware, nutritionController.delete);

// UPDATE a plan (partial or full)
nutritionRouter.patch("/", authMiddleware, nutritionController.update);
nutritionRouter.put("/", authMiddleware, nutritionController.update);

module.exports = nutritionRouter;
