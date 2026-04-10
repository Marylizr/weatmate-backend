const MenstrualCycle = require("../models/menstrualCycleModel");
const { buildInsights } = require("../services/cycleEngine");

// CREATE / UPDATE CYCLE
exports.logCycle = async (req, res) => {
  try {
    const { userId, lastMenstruationDate, cycleLength } = req.body;

    let cycle = await MenstrualCycle.findOne({ userId });

    if (!cycle) {
      cycle = new MenstrualCycle({
        userId,
        lastMenstruationDate,
        cycleLength,
      });
    } else {
      cycle.lastMenstruationDate = lastMenstruationDate;
      cycle.cycleLength = cycleLength || cycle.cycleLength;
    }

    cycle.insights = buildInsights(cycle);
    cycle.updatedAt = new Date();

    await cycle.save();

    res.status(200).json(cycle);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging cycle", error: error.message });
  }
};

// DAILY CHECK-IN (NUEVO)
exports.addDailyLog = async (req, res) => {
  try {
    const { userId, energy, fatigue, sleep, performance, mood } = req.body;

    const cycle = await MenstrualCycle.findOne({ userId });

    if (!cycle) {
      return res.status(404).json({ message: "Cycle not found" });
    }

    cycle.dailyLogs.push({
      energy,
      fatigue,
      sleep,
      performance,
      mood,
    });

    cycle.insights = buildInsights(cycle);
    cycle.updatedAt = new Date();

    await cycle.save();

    res.status(200).json(cycle);
  } catch (error) {
    res.status(500).json({ message: "Error saving log", error: error.message });
  }
};

// GET LATEST
exports.getLatestCycle = async (req, res) => {
  try {
    const { userId } = req.params;

    const cycle = await MenstrualCycle.findOne({ userId });

    if (!cycle) {
      return res.status(404).json({ message: "No cycle data found" });
    }

    res.status(200).json(cycle);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving cycle data", error: error.message });
  }
};
