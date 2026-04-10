const express = require("express");
const router = express.Router();
const controller = require("../controllers/menstrualCycleController");

router.post("/", controller.logCycle);
router.post("/daily-log", controller.addDailyLog);
router.get("/latest/:userId", controller.getLatestCycle);

module.exports = router;
