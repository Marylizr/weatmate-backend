const Progress = require("../models/progessModel");

// Cache temporal (solo en memoria del servidor)
let progressCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 1000 * 60 * 2; // 2 min

exports.findAll = async (req, res) => {
  try {
    // ===============================
    //          QUERY PARAMS
    // ===============================

    // Pagination
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit =
      parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;

    // Filter by userId
    const userId = req.query.userId;

    // Date filters
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // Build query object
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    // ===============================
    //             CACHE
    // ===============================

    const now = Date.now();
    const shouldUseCache =
      progressCache &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_TTL &&
      !userId &&
      !from &&
      !to; // cache only when no filters

    if (shouldUseCache) {
      const cached = progressCache.slice(skip, skip + limit);
      return res.status(200).json({
        items: cached,
        pagination: {
          totalItems: progressCache.length,
          totalPages: Math.ceil(progressCache.length / limit),
          currentPage: page,
          limit,
          hasNextPage: page * limit < progressCache.length,
          hasPrevPage: page > 1,
        },
      });
    }

    // ===============================
    //             QUERY
    // ===============================
    const totalItems = await Progress.countDocuments(query);

    const items = await Progress.find(query)
      .sort({ date: -1 }) // newest → oldest
      .skip(skip)
      .limit(limit);

    // Update cache only when no filters
    if (!userId && !from && !to) {
      progressCache = await Progress.find().sort({ date: -1 });
      cacheTimestamp = Date.now();
    }

    // ===============================
    //       MONTH/YEAR ANALYTICS
    // ===============================
    const allForUser = userId
      ? await Progress.find({ userId }).sort({ date: 1 })
      : [];

    let countByMonth = {};
    let countByYear = {};

    if (allForUser.length > 0) {
      allForUser.forEach((entry) => {
        const d = new Date(entry.date);
        const monthKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        const yearKey = `${d.getFullYear()}`;

        countByMonth[monthKey] = (countByMonth[monthKey] || 0) + 1;
        countByYear[yearKey] = (countByYear[yearKey] || 0) + 1;
      });
    }

    // ===============================
    //       RESPONSE
    // ===============================
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
      analytics: {
        countByMonth,
        countByYear,
      },
    });
  } catch (err) {
    console.error("Error in findAll:", err);
    res.status(500).json({ error: "Failed to fetch progress entries." });
  }
};

// ==============================
// GET ONE BY ID
// ==============================
exports.findOne = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch progress entry." });
  }
};

// ==============================
// CREATE NEW PROGRESS ENTRY
// ==============================
exports.create = async (req, res) => {
  try {
    const data = req.body;

    if (!data.userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const dataPosted = {
      name: data.name || "",
      userId: data.userId,

      // new fields + original ones
      weight: data.weight || null,
      waist: data.waist || null,
      hips: data.hips || null,
      chest: data.chest || null,
      neck: data.neck || null,
      bodyFat: data.bodyFat || null,

      date: data.date || new Date(),
      note: data.note || "",
      picture: data.picture || null,
    };

    const newProgress = new Progress(dataPosted);
    await newProgress.save();

    return res.json({
      message: "Progress saved successfully",
      newProgress,
    });
  } catch (err) {
    console.error("Progress create error:", err);
    return res.status(500).json({ error: "Server error creating progress." });
  }
};

// ==============================
// UPDATE ONE
// ==============================
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const updated = await Progress.findOneAndUpdate({ _id: id }, data, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    res.status(200).json({
      message: "Progress updated successfully.",
      updated,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update progress entry." });
  }
};

// ==============================
// DELETE ONE
// ==============================
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Progress.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Progress entry not found." });
    }

    return res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete progress entry." });
  }
};
