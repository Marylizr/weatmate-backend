const express = require("express");
const addWorkoutController = require("../controllers/addWorkoutController");
const addWorkoutRouter = express.Router();

addWorkoutRouter.get("/", addWorkoutController.findAll);
addWorkoutRouter.get("/:id", addWorkoutController.findOne);
addWorkoutRouter.post("/", addWorkoutController.create);
addWorkoutRouter.delete("/:id", addWorkoutController.delete);
addWorkoutRouter.patch("/:id", addWorkoutController.update);
addWorkoutRouter.put("/:id", addWorkoutController.update);

module.exports = { addWorkoutRouter };
