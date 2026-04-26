// controllers/trainingPlanController.js
const mongoose = require("mongoose");
const TrainingPlan = require("../models/trainingPlanModel");

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

const safeStr = (v) => (typeof v === "string" ? v.trim() : v);
const toInt = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeYYYYMMDD = (v) => {
  if (!v || typeof v !== "string") return "";
  const s = v.trim();
  // minimal check "YYYY-MM-DD"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  return s;
};

const denyIfNoUser = (req, res) => {
  if (!req.user?._id || !req.user?.role) {
    res.status(401).json({ message: "Unauthorized." });
    return true;
  }
  return false;
};

const canTrainerAccessPlan = (reqUser, plan) => {
  if (!reqUser) return false;
  if (reqUser.role === "admin") return true;
  if (reqUser.role === "personal-trainer") {
    return String(plan.trainerId) === String(reqUser._id);
  }
  return false;
};

const canClientReadPlan = (reqUser, plan) => {
  if (!reqUser) return false;
  if (reqUser.role === "admin") return true;
  if (reqUser.role === "basic") {
    return (
      String(plan.clientId) === String(reqUser._id) &&
      plan.status === "published"
    );
  }
  return false;
};

// Build a default empty week structure (Mon-Sun)
const buildDefaultWeek = (weekIndex = 1, startDate = "", endDate = "") => ({
  weekIndex,
  startDate,
  endDate,
  label: `Week ${weekIndex}`,
  focus: "",
  isDeload: false,
  days: Array.from({ length: 7 }).map((_, i) => ({
    date: "",
    dayOfWeek: i, // define in UI as 0=Mon..6=Sun
    title: "",
    focus: "",
    durationMin: 0,
    warmup: "",
    cooldown: "",
    notes: "",
    rpeCap: 0,
    volumeCap: 0,
    exercises: [],
  })),
});

exports.create = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const role = req.user.role;
    const isAdmin = role === "admin";
    const isTrainer = role === "personal-trainer";

    if (!isAdmin && !isTrainer) {
      return res.status(403).json({ message: "Access denied." });
    }

    const clientId = req.body?.clientId;
    const trainerId =
      isAdmin && req.body?.trainerId ? req.body.trainerId : req.user._id;

    if (!clientId || !isObjectId(clientId)) {
      return res.status(400).json({ message: "Valid clientId is required." });
    }
    if (!trainerId || !isObjectId(trainerId)) {
      return res.status(400).json({ message: "Valid trainerId is required." });
    }

    const title = safeStr(req.body?.title) || "Training Plan";
    const description = safeStr(req.body?.description) || "";
    const macroGoal = safeStr(req.body?.macroGoal) || "";

    const startDate = normalizeYYYYMMDD(req.body?.startDate) || "";
    const endDate = normalizeYYYYMMDD(req.body?.endDate) || "";

    const totalWeeks = toInt(req.body?.totalWeeks, 0);

    // Optional: create with initial weeks skeleton
    const initialWeeks = Array.isArray(req.body?.weeks) ? req.body.weeks : null;
    let weeks = [];

    if (initialWeeks && initialWeeks.length > 0) {
      // Trust but normalize minimally
      weeks = initialWeeks.map((w, idx) => ({
        weekIndex: toInt(w.weekIndex, idx + 1),
        startDate: normalizeYYYYMMDD(w.startDate) || "",
        endDate: normalizeYYYYMMDD(w.endDate) || "",
        label: safeStr(w.label) || `Week ${toInt(w.weekIndex, idx + 1)}`,
        focus: safeStr(w.focus) || "",
        isDeload: Boolean(w.isDeload),
        days: Array.isArray(w.days) ? w.days : buildDefaultWeek(idx + 1).days,
      }));
    } else if (totalWeeks > 0) {
      weeks = Array.from({ length: totalWeeks }).map((_, i) =>
        buildDefaultWeek(i + 1),
      );
    }

    const mesocycles = Array.isArray(req.body?.mesocycles)
      ? req.body.mesocycles
      : [];

    const plan = await TrainingPlan.create({
      trainerId,
      clientId,
      status: "draft",
      title,
      description,
      macroGoal,
      startDate,
      endDate,
      totalWeeks: totalWeeks > 0 ? totalWeeks : weeks.length,
      mesocycles,
      weeks,
      version: 1,
      publishedAt: null,
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json(plan);
  } catch (err) {
    console.error("Error creating training plan:", err);
    return res
      .status(500)
      .json({ message: "Unable to create training plan", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const role = req.user.role;
    const isAdmin = role === "admin";
    const isTrainer = role === "personal-trainer";
    const isClient = role === "basic";

    const clientId = req.query?.clientId;
    const trainerId = req.query?.trainerId;
    const status = req.query?.status;
    const isActive = req.query?.isActive;
    const weekStart = req.query?.weekStart;

    const query = {};

    // ---------- ROLE FILTER ----------
    if (isAdmin) {
      if (clientId && isObjectId(clientId)) query.clientId = clientId;
      if (trainerId && isObjectId(trainerId)) query.trainerId = trainerId;
    } else if (isTrainer) {
      query.trainerId = req.user._id;
      if (clientId && isObjectId(clientId)) query.clientId = clientId;
    } else if (isClient) {
      query.clientId = req.user._id;
      query.status = "published";
      query.isActive = true;
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    // ---------- WEEK FILTER (CLAVE) ----------
    if (weekStart) {
      query.weekStart = weekStart;
    }

    // ---------- OPTIONAL FILTERS ----------
    if (status && ["draft", "published", "archived"].includes(status)) {
      query.status = status;
    }

    if (typeof isActive !== "undefined") {
      query.isActive = String(isActive) === "true";
    }

    // ---------- QUERY ----------
    const plans = await TrainingPlan.find(query).sort({ updatedAt: -1 });

    return res.status(200).json(plans);
  } catch (err) {
    console.error("Error listing training plans:", err);
    return res.status(500).json({
      message: "Unable to list training plans",
      error: err.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const id = req.params?.id;
    if (!id || !isObjectId(id)) {
      return res.status(400).json({ message: "Valid plan id is required." });
    }

    const plan = await TrainingPlan.findById(id);
    if (!plan)
      return res.status(404).json({ message: "Training plan not found." });

    const reqUser = req.user;
    if (
      !canTrainerAccessPlan(reqUser, plan) &&
      !canClientReadPlan(reqUser, plan)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.status(200).json(plan);
  } catch (err) {
    console.error("Error retrieving training plan:", err);
    return res.status(500).json({
      message: "Unable to retrieve training plan",
      error: err.message,
    });
  }
};

// Draft updates (trainer/admin only)
// You can send partial payload; we merge only allowed fields.
exports.update = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const id = req.params?.id;
    if (!id || !isObjectId(id)) {
      return res.status(400).json({ message: "Valid plan id is required." });
    }

    const plan = await TrainingPlan.findById(id);
    if (!plan)
      return res.status(404).json({ message: "Training plan not found." });

    if (!canTrainerAccessPlan(req.user, plan)) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (plan.status === "archived") {
      return res
        .status(400)
        .json({ message: "Archived plans cannot be updated." });
    }

    // Allowed draft update fields
    const allowedTop = [
      "title",
      "description",
      "macroGoal",
      "startDate",
      "endDate",
      "totalWeeks",
      "mesocycles",
      "weeks",
      "isActive",
    ];
    const updateData = {};

    for (const k of allowedTop) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, k))
        updateData[k] = req.body[k];
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "title"))
      updateData.title = safeStr(updateData.title) || plan.title;
    if (Object.prototype.hasOwnProperty.call(updateData, "description"))
      updateData.description = safeStr(updateData.description) || "";
    if (Object.prototype.hasOwnProperty.call(updateData, "macroGoal"))
      updateData.macroGoal = safeStr(updateData.macroGoal) || "";
    if (Object.prototype.hasOwnProperty.call(updateData, "startDate"))
      updateData.startDate = normalizeYYYYMMDD(updateData.startDate) || "";
    if (Object.prototype.hasOwnProperty.call(updateData, "endDate"))
      updateData.endDate = normalizeYYYYMMDD(updateData.endDate) || "";
    if (Object.prototype.hasOwnProperty.call(updateData, "totalWeeks"))
      updateData.totalWeeks = toInt(updateData.totalWeeks, plan.totalWeeks);

    // Prevent clients from changing status/version/publishedAt in update
    delete updateData.status;
    delete updateData.version;
    delete updateData.publishedAt;

    updateData.updatedBy = req.user._id;

    const updated = await TrainingPlan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: "query",
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating training plan:", err);
    return res
      .status(500)
      .json({ message: "Unable to update training plan", error: err.message });
  }
};

exports.publish = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const id = req.params?.id;
    if (!id || !isObjectId(id)) {
      return res.status(400).json({ message: "Valid plan id is required." });
    }

    const plan = await TrainingPlan.findById(id);
    if (!plan)
      return res.status(404).json({ message: "Training plan not found." });

    if (!canTrainerAccessPlan(req.user, plan)) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!Array.isArray(plan.weeks) || plan.weeks.length === 0) {
      return res
        .status(400)
        .json({ message: "Cannot publish an empty plan (no weeks)." });
    }

    // Ensure only one active published plan per trainer+client (optional)
    await TrainingPlan.updateMany(
      {
        trainerId: plan.trainerId,
        clientId: plan.clientId,
        status: "published",
        isActive: true,
        _id: { $ne: plan._id },
      },
      { $set: { isActive: false, updatedBy: req.user._id } },
    );

    plan.status = "published";
    plan.isActive = true;
    plan.publishedAt = new Date();
    plan.version = toInt(plan.version, 1) + 1;
    plan.updatedBy = req.user._id;

    await plan.save();

    return res.status(200).json(plan);
  } catch (err) {
    console.error("Error publishing training plan:", err);
    return res
      .status(500)
      .json({ message: "Unable to publish training plan", error: err.message });
  }
};

exports.archive = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const id = req.params?.id;
    if (!id || !isObjectId(id)) {
      return res.status(400).json({ message: "Valid plan id is required." });
    }

    const plan = await TrainingPlan.findById(id);
    if (!plan)
      return res.status(404).json({ message: "Training plan not found." });

    if (!canTrainerAccessPlan(req.user, plan)) {
      return res.status(403).json({ message: "Access denied." });
    }

    plan.status = "archived";
    plan.isActive = false;
    plan.updatedBy = req.user._id;
    await plan.save();

    return res.status(200).json({ message: "Plan archived.", plan });
  } catch (err) {
    console.error("Error archiving training plan:", err);
    return res
      .status(500)
      .json({ message: "Unable to archive training plan", error: err.message });
  }
};

exports.duplicateWeek = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const id = req.params?.id;
    const weekIndex = toInt(req.params?.weekIndex, 0);
    if (!id || !isObjectId(id) || !weekIndex || weekIndex < 1) {
      return res
        .status(400)
        .json({ message: "Valid plan id and weekIndex are required." });
    }

    const plan = await TrainingPlan.findById(id);
    if (!plan)
      return res.status(404).json({ message: "Training plan not found." });

    if (!canTrainerAccessPlan(req.user, plan)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const src = plan.weeks.find((w) => toInt(w.weekIndex, 0) === weekIndex);
    if (!src) return res.status(404).json({ message: "Week not found." });

    const newWeekIndex = plan.weeks.length + 1;

    const cloned = JSON.parse(JSON.stringify(src));
    cloned.weekIndex = newWeekIndex;
    cloned.label = `Week ${newWeekIndex}`;
    cloned.startDate = "";
    cloned.endDate = "";

    // Clear day-specific dates if present
    if (Array.isArray(cloned.days)) {
      cloned.days = cloned.days.map((d) => ({
        ...d,
        date: "",
      }));
    }

    plan.weeks.push(cloned);
    plan.totalWeeks = plan.weeks.length;
    plan.updatedBy = req.user._id;
    await plan.save();

    return res.status(200).json(plan);
  } catch (err) {
    console.error("Error duplicating week:", err);
    return res
      .status(500)
      .json({ message: "Unable to duplicate week", error: err.message });
  }
};

// Client: get active published plan, today (returns only today's day object)
// Query param: date=YYYY-MM-DD (optional)
exports.getActiveToday = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const role = req.user.role;
    if (role !== "basic" && role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const clientId =
      role === "admin" && req.query?.clientId
        ? req.query.clientId
        : req.user._id;
    if (!clientId || !isObjectId(clientId)) {
      return res.status(400).json({ message: "Valid clientId is required." });
    }

    const date = normalizeYYYYMMDD(req.query?.date) || "";

    const plan = await TrainingPlan.findOne({
      clientId,
      status: "published",
      isActive: true,
    }).sort({ publishedAt: -1 });

    if (!plan)
      return res.status(404).json({ message: "No active plan found." });

    // Find day by exact date if provided; else try today's date (client should send)
    const targetDate = date;
    let foundDay = null;
    let foundWeek = null;

    if (targetDate) {
      for (const w of plan.weeks || []) {
        const d = (w.days || []).find(
          (x) => String(x.date || "") === targetDate,
        );
        if (d) {
          foundDay = d;
          foundWeek = w;
          break;
        }
      }
    }

    // If not found by date, fallback: first non-empty day (safe fallback)
    if (!foundDay) {
      for (const w of plan.weeks || []) {
        const d = (w.days || []).find(
          (x) => Array.isArray(x.exercises) && x.exercises.length > 0,
        );
        if (d) {
          foundDay = d;
          foundWeek = w;
          break;
        }
      }
    }

    if (!foundDay) {
      return res.status(200).jsonjson({
        planId: plan._id,
        title: plan.title,
        message: "No session found for the requested day.",
        day: null,
      });
    }

    return res.status(200).json({
      planId: plan._id,
      title: plan.title,
      weekIndex: foundWeek?.weekIndex || null,
      day: foundDay,
    });
  } catch (err) {
    console.error("Error getting active plan today:", err);
    return res.status(500).json({
      message: "Unable to retrieve today's session",
      error: err.message,
    });
  }
};

// Client: get active published plan, a week summary (weekIndex required)
exports.getActiveWeek = async (req, res) => {
  try {
    if (denyIfNoUser(req, res)) return;

    const role = req.user.role;
    if (role !== "basic" && role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const clientId =
      role === "admin" && req.query?.clientId
        ? req.query.clientId
        : req.user._id;
    if (!clientId || !isObjectId(clientId)) {
      return res.status(400).json({ message: "Valid clientId is required." });
    }

    const weekIndex = toInt(req.query?.weekIndex, 0);
    if (!weekIndex || weekIndex < 1) {
      return res.status(400).json({ message: "weekIndex is required (>=1)." });
    }

    const plan = await TrainingPlan.findOne({
      clientId,
      status: "published",
      isActive: true,
    }).sort({ publishedAt: -1 });

    if (!plan)
      return res.status(404).json({ message: "No active plan found." });

    const week = (plan.weeks || []).find(
      (w) => toInt(w.weekIndex, 0) === weekIndex,
    );
    if (!week) return res.status(404).json({ message: "Week not found." });

    // Return week with only essential fields (still includes exercises)
    return res.status(200).json({
      planId: plan._id,
      title: plan.title,
      week,
    });
  } catch (err) {
    console.error("Error getting active week:", err);
    return res
      .status(500)
      .json({ message: "Unable to retrieve week", error: err.message });
  }
};

// helper simple
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.getTrainerDashboard = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { week } = req.query; // YYYY-MM-DD (optional)

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID." });
    }

    const isAdmin = req.user.role === "admin";
    const isTrainer = req.user.role === "personal-trainer";

    if (!isAdmin && !isTrainer) {
      return res.status(403).json({ message: "Access denied." });
    }

    // ---------- USER SNAPSHOT ----------
    const user = await User.findById(clientId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Client not found." });
    }

    // trainer can only access own clients
    if (!isAdmin) {
      if (!user.trainerId || user.trainerId.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Access denied to this client." });
      }
    }

    // ---------- WEEK RANGE ----------
    const baseDate = week ? new Date(week) : new Date();
    const weekStart = startOfWeek(baseDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // ---------- TRAINING PLAN ----------
    const trainingPlan = await TrainingPlan.findOne({
      clientId,
      weekStart,
    })
      .populate("days.workouts.workoutId")
      .lean();

    // ---------- RESPONSE ----------
    return res.status(200).json({
      client: {
        id: user._id,
        name: user.name,
        image: user.image,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitness_level: user.fitness_level,
        goal: user.goal,

        // FEMALE CORE
        femaleProfile: user.femaleProfile || null,
      },

      week: {
        start: weekStart,
        end: weekEnd,
      },

      trainingPlan: trainingPlan || {
        status: "empty",
        days: [],
      },
    });
  } catch (err) {
    console.error("getTrainerDashboard error:", err);
    return res.status(500).json({
      message: "Unable to load trainer dashboard",
      error: err.message,
    });
  }
};
