const MenstrualCycle = require("../models/menstrualCycleModel");
const nodemailer = require("nodemailer");

//  Log a new cycle & Save previous one in history
exports.logCycle = async (req, res) => {
  try {
    const { userId, lastMenstruationDate, currentPhase, recommendations } = req.body;

    const existingCycle = await MenstrualCycle.findOne({ userId }).sort({ date: -1 });

    if (existingCycle) {
      existingCycle.history.push({
        lastMenstruationDate: existingCycle.lastMenstruationDate,
        currentPhase: existingCycle.currentPhase,
        recommendations: existingCycle.recommendations,
        date: existingCycle.date
      });

      existingCycle.lastMenstruationDate = lastMenstruationDate;
      existingCycle.currentPhase = currentPhase;
      existingCycle.recommendations = recommendations;
      existingCycle.date = new Date();

      await existingCycle.save();
      return res.status(200).json({ message: "Cycle updated and saved to history", cycle: existingCycle });
    }

    const newCycle = new MenstrualCycle({
      userId,
      lastMenstruationDate,
      currentPhase,
      recommendations,
      date: new Date()
    });

    await newCycle.save();
    res.status(201).json({ message: "Cycle logged successfully", cycle: newCycle });

  } catch (error) {
    res.status(500).json({ message: "Error logging cycle", error: error.message });
  }
};

// Get the latest menstrual cycle for a user
exports.getLatestCycle = async (req, res) => {
  try {
    const { userId } = req.params;
    const cycle = await MenstrualCycle.findOne({ userId }).sort({ date: -1 });

    if (!cycle) {
      return res.status(404).json({ message: "No cycle data found" });
    }

    res.status(200).json(cycle);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cycle data", error: error.message });
  }
};

// 🔹 3. Get all cycle history for a user
exports.getCycleHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const cycle = await MenstrualCycle.findOne({ userId }).sort({ date: -1 });

    if (!cycle || !cycle.history.length) {
      return res.status(404).json({ message: "No cycle history found" });
    }

    res.status(200).json(cycle.history);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cycle history", error: error.message });
  }
};

// Send notifications about the upcoming menstrual cycle
exports.sendCycleNotifications = async () => {
  try {
    const users = await MenstrualCycle.find();

    users.forEach(async (cycle) => {
      const lastDate = new Date(cycle.lastMenstruationDate);
      const today = new Date();
      const daysSinceLastCycle = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      let upcomingPhase;
      if (daysSinceLastCycle >= 20) upcomingPhase = "Menstrual Phase";
      else if (daysSinceLastCycle >= 6) upcomingPhase = "Follicular Phase";
      else upcomingPhase = "Luteal Phase";

      if (upcomingPhase) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: cycle.userId.email,
          subject: "Upcoming Menstrual Phase",
          text: `Hey! Your next phase (${upcomingPhase}) is coming soon. Here are some tips to prepare!`,
        };

        transporter.sendMail(mailOptions);
      }
    });

  } catch (error) {
    console.error("Error sending cycle notifications:", error);
  }
};

//  Delete a specific cycle
exports.deleteCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const deletedCycle = await MenstrualCycle.findByIdAndDelete(cycleId);

    if (!deletedCycle) {
      return res.status(404).json({ message: "Cycle not found" });
    }

    res.status(200).json({ message: "Cycle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting cycle", error: error.message });
  }
};
