const express = require("express");
const moodTrackerController = require("../controllers/moodTrackerController");
const moodTrackerRouter = express.Router();

// GET all
moodTrackerRouter.get("/", moodTrackerController.findAll);

// GET by userId (nuevo y necesario)
moodTrackerRouter.get("/user/:userId", moodTrackerController.findByUser);

// GET by id
moodTrackerRouter.get("/:id", moodTrackerController.findOne);

// CREATE
moodTrackerRouter.post("/", moodTrackerController.create);

// DELETE
moodTrackerRouter.delete("/:id", moodTrackerController.delete);

// UPDATE
moodTrackerRouter.put("/:id", moodTrackerController.update);

module.exports = moodTrackerRouter;
