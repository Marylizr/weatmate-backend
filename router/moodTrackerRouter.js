const express = require("express");
const moodTrackerController = require("../controllers/moodTrackerController");
const moodTrackerRouter = express.Router();

moodTrackerRouter.get("", moodTrackerController.findAll);
moodTrackerRouter.get("/user/:userId", moodTrackerController.findByUser);
moodTrackerRouter.get("/:id", moodTrackerController.findOne);
moodTrackerRouter.post("", moodTrackerController.create);
moodTrackerRouter.delete("/:id", moodTrackerController.delete);
moodTrackerRouter.put("/:id", moodTrackerController.update);

module.exports = moodTrackerRouter;
