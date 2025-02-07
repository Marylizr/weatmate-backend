const express = require("express");
const menstrualCycleRouter = express.Router();
const menstrualCycleController = require("../controllers/menstrualCycleController");

menstrualCycleRouter.post("/", menstrualCycleController.logCycle);  // Log new cycle
menstrualCycleRouter.get("/latest/:userId", menstrualCycleController.getLatestCycle);  // Get latest cycle
menstrualCycleRouter.get("/history/:userId", menstrualCycleController.getCycleHistory);  // Get cycle history
menstrualCycleRouter.delete("/:cycleId", menstrualCycleController.deleteCycle);  // Delete a cycle


module.exports = menstrualCycleRouter;
