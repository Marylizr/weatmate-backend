const express = require("express");
const addWorkoutController = require("../controllers/addWorkoutController");
const addWorkoutRouter = express.Router();

const { authMiddleware } = require("../auth/authMiddleware");


addWorkoutRouter.get("/", authMiddleware, addWorkoutController.findAll);
addWorkoutRouter.get("/:id", authMiddleware, addWorkoutController.findOne);

addWorkoutRouter.post("/", authMiddleware, addWorkoutController.create);
addWorkoutRouter.delete("/:id", authMiddleware, addWorkoutController.delete);
addWorkoutRouter.patch("/:id", authMiddleware, addWorkoutController.update);
addWorkoutRouter.put("/:id", authMiddleware, addWorkoutController.update);

module.exports = { addWorkoutRouter };
