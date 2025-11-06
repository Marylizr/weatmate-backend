const express = require("express");
const addWorkoutController = require("../controllers/addWorkoutController");
const addWorkoutRouter = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");

addWorkoutRouter.get("/", addWorkoutController.findAll);
addWorkoutRouter.get("/:id", addWorkoutController.findOne);
addWorkoutRouter.post("/", addWorkoutController.create);
addWorkoutRouter.delete("/:id", authMiddleware, addWorkoutController.delete);
addWorkoutRouter.patch("/:id", authMiddleware, addWorkoutController.update);
addWorkoutRouter.put("/:id", authMiddleware, addWorkoutController.update);

module.exports = { addWorkoutRouter };
