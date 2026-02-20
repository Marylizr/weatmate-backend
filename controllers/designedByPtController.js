const DesignedByPt = require('../models/designedByPtModel');



// Helpers
const isYYYYMMDD = (s) =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

const sanitizeWorkout = (w) => ({
  workoutId: w?.workoutId || w?._id || undefined,
  type: w?.type || "",
  workoutName: w?.workoutName || w?.name || "",
  description: w?.description || w?.content || "",
  reps: w?.reps || "",
  series: w?.series || "",
  picture: w?.picture || "",
  video: w?.video || "",
  workoutLevel: w?.workoutLevel || w?.subCategory || "",
  subType: w?.subType || "",
});

exports.getAssignments = async (req, res) => {
  try {
    const { userId, start, end } = req.query;

    if (!userId) return res.status(400).json({ message: "userId is required" });

    // If no range, return all for user (not recommended but ok)
    const query = { userId };

    if (start || end) {
      if (start && !isYYYYMMDD(start))
        return res.status(400).json({ message: "start must be YYYY-MM-DD" });
      if (end && !isYYYYMMDD(end))
        return res.status(400).json({ message: "end must be YYYY-MM-DD" });

      if (start && end) query.date = { $gte: start, $lte: end };
      else if (start) query.date = { $gte: start };
      else if (end) query.date = { $lte: end };
    }

    const rows = await DesignedByPt.find(query).sort({ date: 1 });
    return res.status(200).json(rows);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Unable to retrieve assignments", error: err.message });
  }
};

// Create/Upsert one day (userId + date unique)
exports.upsertDay = async (req, res) => {
  try {
    const {
      userId,
      trainerId,
      date,
      workouts,
      dayLabel,
      notes,
      templateName,
      createdFromTemplate,
    } = req.body || {};

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!trainerId)
      return res.status(400).json({ message: "trainerId is required" });
    if (!isYYYYMMDD(date))
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });

    const safeWorkouts = Array.isArray(workouts)
      ? workouts.map(sanitizeWorkout)
      : [];

    const updated = await DesignedByPt.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          userId,
          trainerId,
          date,
          dayLabel: dayLabel || "",
          notes: notes || "",
          templateName: templateName || "",
          createdFromTemplate: !!createdFromTemplate,
          workouts: safeWorkouts,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(updated);
  } catch (err) {
    // Duplicate key edge case should not happen with findOneAndUpdate upsert, but keep robust
    return res
      .status(500)
      .json({ message: "Unable to save day assignment", error: err.message });
  }
};

exports.deleteDay = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DesignedByPt.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Assignment not found" });
    return res.status(204).send();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Unable to delete assignment", error: err.message });
  }
};

exports.delete = (req,res) => { 
const id = req.params.id;
DesignedByPt.findByIdAndDelete(id, {}, (error, result) => {
   if(error){
      res.status(500).json({error: error.message});
   } else if(!result){
      res.status(404);
   }else{
      res.status(204).send();
   }
})
};

exports.findOne = async (req, res) => {
   res.status(200).json(await DesignedByPt.findOne(req.params.name));
}


exports.findAll = async (req, res) => {
  try {
    const { userId, name } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (!userId && name) query.name = name;

    const result = await DesignedByPt.find(query).sort({ date: 1 });
    res.status(200).json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unable to retrieve workouts", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      userId,
      trainerId,
      userName,
      date,
      type,
      workoutName,
      description,
      picture,
      video,
    } = req.body;

    if (!userId && !userName) {
      return res.status(400).json({ message: "userId or userName required" });
    }

    const newWorkout = await DesignedByPt.create({
      userId: userId || undefined,
      trainerId: trainerId || undefined,
      name: userName || undefined,
      date,
      type,
      workoutName,
      description,
      picture,
      video,
    });

    res.status(201).json(newWorkout);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unable to create workout", error: err.message });
  }
};

