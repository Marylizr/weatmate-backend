const express = require("express");
const saveWorkController = require("../controllers/saveWorkoutController");
const saveWorkoutRouter = express.Router();

saveWorkoutRouter.get("/", saveWorkController.findAll);
saveWorkoutRouter.get("/:id", saveWorkController.findOne);
saveWorkoutRouter.post("/", saveWorkController.create);
saveWorkoutRouter.delete("/:id", saveWorkController.delete);
saveWorkoutRouter.patch("/:id", saveWorkController.update);
saveWorkoutRouter.put("/:id", saveWorkController.update);

module.exports = saveWorkoutRouter;
