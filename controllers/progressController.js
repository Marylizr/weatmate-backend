const mongoose = require("mongoose");
const Progress = require("../models/progessModel");
const User = require("../models/userModel");

const MAX_LIMIT = 100;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const getAuthUserId = (req) => {
  return req.user?.id || req.user?._id || null;
};

const getAuthRole = (req) => {
  return req.user?.role || "";
};

const isAdminRole = (role) => role === "admin";

const isTrainerRole = (role) => role === "personal-trainer";

const isClientRole = (role) => role === "client" || role === "basic";

const safeDate = (value) => {
  if (!value) return null;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sanitizeString = (value, maxLength = 1000) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const parseNullableNumber = (value, options = {}) => {
  const { min = 0, max = null } = options;

  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (parsed < min) {
    return null;
  }

  if (max !== null && parsed > max) {
    return null;
  }

  return parsed;
};

const sameId = (a, b) => {
  if (!a || !b) return false;
  return String(a) === String(b);
};

const includesId = (list, id) => {
  if (!Array.isArray(list)) return false;
  return list.some((item) => sameId(item, id));
};

const getAssignedTrainerIdsFromUser = (user) => {
  if (!user) return [];

  const ids = [];

  if (user.personalTrainerId) ids.push(user.personalTrainerId);
  if (user.trainerId) ids.push(user.trainerId);
  if (user.assignedTrainer) ids.push(user.assignedTrainer);
  if (user.personalTrainer) ids.push(user.personalTrainer);

  if (Array.isArray(user.trainers)) {
    ids.push(...user.trainers);
  }

  if (Array.isArray(user.trainerIds)) {
    ids.push(...user.trainerIds);
  }

  return ids.filter(Boolean).map(String);
};

const canAccessUserProgress = async (req, targetUserId) => {
  const authId = getAuthUserId(req);
  const role = getAuthRole(req);

  if (!authId) return false;
  if (!isValidObjectId(targetUserId)) return false;

  if (isAdminRole(role)) {
    return true;
  }

  if (isClientRole(role)) {
    return sameId(authId, targetUserId);
  }

  if (isTrainerRole(role)) {
    if (sameId(authId, targetUserId)) {
      return true;
    }

    const targetUser = await User.findById(targetUserId).select(
      "role personalTrainerId trainerId assignedTrainer personalTrainer trainers trainerIds",
    );

    if (!targetUser) return false;

    const assignedTrainerIds = getAssignedTrainerIdsFromUser(targetUser);

    return includesId(assignedTrainerIds, authId);
  }

  return false;
};

const getTrainerClientIds = async (trainerId) => {
  if (!trainerId || !isValidObjectId(trainerId)) return [];

  const clients = await User.find({
    $or: [
      { personalTrainerId: trainerId },
      { trainerId: trainerId },
      { assignedTrainer: trainerId },
      { personalTrainer: trainerId },
      { trainers: trainerId },
      { trainerIds: trainerId },
    ],
  }).select("_id");

  return clients.map((client) => client._id);
};

const buildProgressPayload = (data, options = {}) => {
  const { partial = false } = options;

  const payload = {};

  if (!partial || data.name !== undefined) {
    payload.name = sanitizeString(data.name, 120);
  }

  if (!partial || data.weight !== undefined) {
    payload.weight = parseNullableNumber(data.weight, { min: 0 });
  }

  if (!partial || data.waist !== undefined) {
    payload.waist = parseNullableNumber(data.waist, { min: 0 });
  }

  if (!partial || data.hips !== undefined) {
    payload.hips = parseNullableNumber(data.hips, { min: 0 });
  }

  if (!partial || data.chest !== undefined) {
    payload.chest = parseNullableNumber(data.chest, { min: 0 });
  }

  if (!partial || data.neck !== undefined) {
    payload.neck = parseNullableNumber(data.neck, { min: 0 });
  }

  if (!partial || data.bodyFat !== undefined) {
    payload.bodyFat = parseNullableNumber(data.bodyFat, {
      min: 0,
      max: 100,
    });
  }

  if (!partial || data.note !== undefined) {
    payload.note = sanitizeString(data.note, 1000);
  }

  if (!partial || data.picture !== undefined) {
    payload.picture = sanitizeString(data.picture, 2000);
  }

  if (!partial || data.date !== undefined) {
    const parsedDate = safeDate(data.date);

    if (data.date && !parsedDate) {
      throw new Error("Invalid date.");
    }

    payload.date = parsedDate || new Date();
  }

  return payload;
};

const hasProgressContent = (payload) => {
  return Boolean(
    payload.weight !== null ||
    payload.waist !== null ||
    payload.hips !== null ||
    payload.chest !== null ||
    payload.neck !== null ||
    payload.bodyFat !== null ||
    payload.picture ||
    payload.note,
  );
};

const buildAnalytics = (entries) => {
  const countByMonth = {};
  const countByYear = {};

  entries.forEach((entry) => {
    const d = safeDate(entry.date);
    if (!d) return;

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}`;

    const yearKey = `${d.getFullYear()}`;

    countByMonth[monthKey] = (countByMonth[monthKey] || 0) + 1;
    countByYear[yearKey] = (countByYear[yearKey] || 0) + 1;
  });

  return {
    countByMonth,
    countByYear,
  };
};

// ==============================
// GET ALL
// ==============================
exports.findAll = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const role = getAuthRole(req);

    if (!authId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const page =
      parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;

    const requestedLimit =
      parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 20;

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query = {};

    const requestedUserId = req.query.userId ? String(req.query.userId) : "";

    if (requestedUserId) {
      if (!isValidObjectId(requestedUserId)) {
        return res.status(400).json({ error: "Invalid userId." });
      }

      const allowed = await canAccessUserProgress(req, requestedUserId);

      if (!allowed) {
        return res.status(403).json({
          error: "Access denied. You cannot access this user's progress.",
        });
      }

      query.userId = toObjectId(requestedUserId);
    } else if (isClientRole(role)) {
      query.userId = toObjectId(authId);
    } else if (isTrainerRole(role)) {
      const clientIds = await getTrainerClientIds(authId);

      if (!clientIds.length) {
        return res.status(200).json({
          items: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
          analytics: {
            countByMonth: {},
            countByYear: {},
          },
        });
      }

      query.userId = { $in: clientIds };
    }

    const from = req.query.from ? safeDate(req.query.from) : null;
    const to = req.query.to ? safeDate(req.query.to) : null;

    if (req.query.from && !from) {
      return res.status(400).json({ error: "Invalid from date." });
    }

    if (req.query.to && !to) {
      return res.status(400).json({ error: "Invalid to date." });
    }

    if (from || to) {
      query.date = {};

      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const totalItems = await Progress.countDocuments(query);

    const items = await Progress.find(query)
      .populate("userId", "name email role image picture profilePicture avatar")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const analyticsSource = requestedUserId
      ? await Progress.find({ userId: toObjectId(requestedUserId) })
          .select("date")
          .sort({ date: 1 })
      : [];

    res.status(200).json({
      items,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
      analytics: buildAnalytics(analyticsSource),
    });
  } catch (err) {
    console.error("Error in progress findAll:", err);
    res.status(500).json({ error: "Failed to fetch progress entries." });
  }
};

// ==============================
// GET ONE BY ID
// ==============================
exports.findOne = async (req, res) => {
  try {
    const authId = getAuthUserId(req);

    if (!authId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const progressId = req.params.id;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ error: "Invalid progress id." });
    }

    const progress = await Progress.findById(progressId).populate(
      "userId",
      "name email role image picture profilePicture avatar",
    );

    if (!progress) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    const allowed = await canAccessUserProgress(
      req,
      progress.userId?._id || progress.userId,
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Access denied. You cannot access this progress entry.",
      });
    }

    res.status(200).json(progress);
  } catch (err) {
    console.error("Error in progress findOne:", err);
    res.status(500).json({ error: "Failed to fetch progress entry." });
  }
};

// ==============================
// CREATE NEW PROGRESS ENTRY
// ==============================
exports.create = async (req, res) => {
  try {
    const authId = getAuthUserId(req);

    if (!authId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const data = req.body || {};

    if (!data.userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    if (!isValidObjectId(data.userId)) {
      return res.status(400).json({ error: "Invalid userId." });
    }

    const allowed = await canAccessUserProgress(req, data.userId);

    if (!allowed) {
      return res.status(403).json({
        error: "Access denied. You cannot create progress for this user.",
      });
    }

    const targetUser = await User.findById(data.userId).select(
      "name email role",
    );

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const payload = buildProgressPayload({
      ...data,
      name: data.name || targetUser.name || "",
    });

    if (!hasProgressContent(payload)) {
      return res.status(400).json({
        error: "Add at least one measurement, note, or picture.",
      });
    }

    const newProgress = await Progress.create({
      ...payload,
      userId: toObjectId(data.userId),
    });

    const populated = await Progress.findById(newProgress._id).populate(
      "userId",
      "name email role image picture profilePicture avatar",
    );

    return res.status(201).json({
      message: "Progress saved successfully.",
      progress: populated,
      newProgress: populated,
    });
  } catch (err) {
    console.error("Progress create error:", err);

    if (err.message === "Invalid date.") {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Server error creating progress." });
  }
};

// ==============================
// UPDATE ONE
// ==============================
exports.update = async (req, res) => {
  try {
    const authId = getAuthUserId(req);

    if (!authId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const progressId = req.params.id;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ error: "Invalid progress id." });
    }

    const existing = await Progress.findById(progressId);

    if (!existing) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    const allowed = await canAccessUserProgress(req, existing.userId);

    if (!allowed) {
      return res.status(403).json({
        error: "Access denied. You cannot update this progress entry.",
      });
    }

    const data = { ...(req.body || {}) };

    delete data.userId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const payload = buildProgressPayload(data, { partial: true });

    const updated = await Progress.findByIdAndUpdate(progressId, payload, {
      new: true,
      runValidators: true,
    }).populate(
      "userId",
      "name email role image picture profilePicture avatar",
    );

    res.status(200).json({
      message: "Progress updated successfully.",
      progress: updated,
      updated,
    });
  } catch (err) {
    console.error("Progress update error:", err);

    if (err.message === "Invalid date.") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to update progress entry." });
  }
};

// ==============================
// DELETE ONE
// ==============================
exports.delete = async (req, res) => {
  try {
    const authId = getAuthUserId(req);

    if (!authId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const progressId = req.params.id;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ error: "Invalid progress id." });
    }

    const existing = await Progress.findById(progressId);

    if (!existing) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    const allowed = await canAccessUserProgress(req, existing.userId);

    if (!allowed) {
      return res.status(403).json({
        error: "Access denied. You cannot delete this progress entry.",
      });
    }

    await Progress.findByIdAndDelete(progressId);

    return res.status(204).send();
  } catch (err) {
    console.error("Progress delete error:", err);
    res.status(500).json({ error: "Failed to delete progress entry." });
  }
};
