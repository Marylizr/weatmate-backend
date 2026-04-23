// controllers/menstrualCycleController.js

const User = require("../models/userModel");
const { buildInsights } = require("../services/cycleEngine");

// CREATE / UPDATE CYCLE (SINGLE SOURCE OF TRUTH)
exports.logCycle = async (req, res) => {
  try {
    const { userId, lastMenstruationDate, cycleLength } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingCycle = user?.femaleProfile?.cycleData || {};

    const updatedCycle = {
      ...existingCycle,
      lastMenstruationDate,
      cycleLength: cycleLength || existingCycle.cycleLength || 28,
      dailyLogs: existingCycle.dailyLogs || [],
    };

    const insights = buildInsights(updatedCycle);

    const cleanCycle = {
      ...updatedCycle,
      insights,
      updatedAt: new Date(),
    };

    await User.findByIdAndUpdate(userId, {
      $set: {
        "femaleProfile.cycleData": cleanCycle,
      },
    });

    res.status(200).json(cleanCycle);
  } catch (error) {
    res.status(500).json({
      message: "Error logging cycle",
      error: error.message,
    });
  }
};

// DAILY CHECK-IN (SINGLE SOURCE)
exports.addDailyLog = async (req, res) => {
  try {
    const { userId, energy, fatigue, sleep, performance, mood } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingCycle = user?.femaleProfile?.cycleData || {};

    const logs = existingCycle.dailyLogs || [];

    const updatedLogs = [
      ...logs,
      {
        energy,
        fatigue,
        sleep,
        performance,
        mood,
        date: new Date(),
      },
    ];

    const updatedCycle = {
      ...existingCycle,
      dailyLogs: updatedLogs,
    };

    const insights = buildInsights(updatedCycle);

    const cleanCycle = {
      ...updatedCycle,
      insights,
      updatedAt: new Date(),
    };

    await User.findByIdAndUpdate(userId, {
      $set: {
        "femaleProfile.cycleData": cleanCycle,
      },
    });

    res.status(200).json(cleanCycle);
  } catch (error) {
    res.status(500).json({
      message: "Error saving log",
      error: error.message,
    });
  }
};

// GET LATEST (ONLY FROM USER)
exports.getLatestCycle = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cycleData = user?.femaleProfile?.cycleData || {};

    return res.status(200).json(cycleData);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving cycle data",
      error: error.message,
    });
  }
};
