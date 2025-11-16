const express = require("express");
const nutritionController = require("../controllers/nutritionController");
const { authMiddleware } = require("../auth/authMiddleware");
const nutritionRouter = express.Router();

// === GET ===
nutritionRouter.get("/", authMiddleware, nutritionController.findAll);
nutritionRouter.get("/:id", authMiddleware, nutritionController.findOne);

// === CREATE ===
nutritionRouter.post("/", authMiddleware, nutritionController.create);

// === UPDATE ===
nutritionRouter.put("/:id", authMiddleware, nutritionController.update);
nutritionRouter.patch("/:id", authMiddleware, nutritionController.update);

// === DELETE ===
nutritionRouter.delete("/:id", authMiddleware, nutritionController.delete);

module.exports = nutritionRouter;
