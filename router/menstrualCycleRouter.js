const express = require("express");
const menstrualCycleRouter = express.Router();
const MenstrualCycleController = require("../controllers/menstrualCycleController");

menstrualCycleRouter.post("/", MenstrualCycleController.logCycle);  // Log new cycle
menstrualCycleRouter.get("/latest/:userId", MenstrualCycleController.getLatestCycle);  // Get latest cycle
menstrualCycleRouter.get("/history/:userId", MenstrualCycleController.getCycleHistory);  // Get cycle history
menstrualCycleRouter.delete("/:cycleId", MenstrualCycleController.deleteCycle);  // Delete a cycle


module.exports = menstrualCycleRouter;
