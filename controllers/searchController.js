// backend/controllers/searchController.js
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const AddWork = require("../models/addWorkoutModel");

const escapeRegExp = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildResult = ({
  type,
  title,
  subtitle = "",
  image = "",
  refId = "",
  userId = "",
  eventId = "",
  workoutId = "",
  meta = {},
}) => ({
  type,
  title,
  subtitle,
  image,
  refId,
  userId,
  eventId,
  workoutId,
  meta,
});

const globalSearch = async (req, res) => {
  try {
    const raw = String(req.query.query || req.query.q || "").trim();

    if (!raw) {
      return res.status(200).json([]);
    }

    // Avoid expensive queries for 1-letter searches
    if (raw.length < 2) {
      return res.status(200).json([]);
    }

    const q = new RegExp(escapeRegExp(raw), "i");

    // Scope data by role
    // admin -> can search all
    // trainer -> only their clients + their workouts (plus general) + events relevant to them
    const role = req.user?.role;
    const requesterId = String(req.user?._id || "");

    // -------------------------
    // USERS (clients)
    // -------------------------
    const userScope =
      role === "admin"
        ? {}
        : role === "personal_trainer"
        ? { trainerId: req.user._id }
        : { _id: req.user._id };

    const users = await User.find({
      ...userScope,
      $or: [{ name: q }, { email: q }],
    })
      .select("_id name email image role trainerId")
      .limit(8)
      .lean();

    const userResults = users.map((u) =>
      buildResult({
        type: "client",
        title: u.name || "Unnamed",
        subtitle: u.email || "",
        image: u.image || "",
        refId: String(u._id),
        userId: String(u._id),
        meta: { role: u.role || "user" },
      })
    );

    // -------------------------
    // SESSION NOTES (embedded in User)
    // -------------------------
    // user.sessionNotes: [{ note, date }]
    const noteUsers = await User.find({
      ...userScope,
      sessionNotes: { $elemMatch: { note: q } },
    })
      .select("_id name email image sessionNotes")
      .limit(6)
      .lean();

    const noteResults = [];
    noteUsers.forEach((u) => {
      (u.sessionNotes || [])
        .filter((n) => q.test(String(n.note || "")))
        .slice(0, 5)
        .forEach((n) => {
          noteResults.push(
            buildResult({
              type: "session_note",
              title: u.name || "Client",
              subtitle: String(n.note || "").slice(0, 120),
              image: u.image || "",
              refId: String(u._id),
              userId: String(u._id),
              meta: {
                date: n.date || null,
              },
            })
          );
        });
    });

    // -------------------------
    // MEDICAL / PREFERENCES (embedded)
    // medicalHistory: [{ history, date }]
    // preferences: [{ preference, date }]
    // -------------------------
    const medicalUsers = await User.find({
      ...userScope,
      $or: [
        { medicalHistory: { $elemMatch: { history: q } } },
        { preferences: { $elemMatch: { preference: q } } },
      ],
    })
      .select("_id name email image medicalHistory preferences")
      .limit(6)
      .lean();

    const medicalResults = [];

    medicalUsers.forEach((u) => {
      (u.medicalHistory || [])
        .filter((m) => q.test(String(m.history || "")))
        .slice(0, 5)
        .forEach((m) => {
          medicalResults.push(
            buildResult({
              type: "medical",
              title: u.name || "Client",
              subtitle: String(m.history || "").slice(0, 120),
              image: u.image || "",
              refId: String(u._id),
              userId: String(u._id),
              meta: { date: m.date || null },
            })
          );
        });

      (u.preferences || [])
        .filter((p) => q.test(String(p.preference || "")))
        .slice(0, 5)
        .forEach((p) => {
          medicalResults.push(
            buildResult({
              type: "preference",
              title: u.name || "Client",
              subtitle: String(p.preference || "").slice(0, 120),
              image: u.image || "",
              refId: String(u._id),
              userId: String(u._id),
              meta: { date: p.date || null },
            })
          );
        });
    });

    // -------------------------
    // EVENTS
    // -------------------------
    // Admin -> all events
    // Trainer -> events created by them OR assigned to their clients OR trainerOnly events
    // User -> events assigned to them
    let eventScope = {};
    if (role === "admin") {
      eventScope = {};
    } else if (role === "personal_trainer") {
      // trainer sees:
      // - events they created
      // - events for their clients (userId in [clientIds])  (we filter via trainerId->client ids quickly)
      const clientIds = users.map((u) => u._id);
      eventScope = {
        $or: [
          { createdBy: req.user._id },
          { trainerOnly: true, createdBy: req.user._id },
          { userId: { $in: clientIds } },
        ],
      };
    } else {
      eventScope = { userId: req.user._id };
    }

    const events = await Event.find({
      ...eventScope,
      $or: [{ title: q }, { description: q }, { location: q }],
    })
      .select("_id title date eventType location duration trainerOnly userId")
      .sort({ date: -1 })
      .limit(8)
      .lean();

    const eventResults = events.map((e) =>
      buildResult({
        type: "event",
        title: e.title || "Event",
        subtitle: e.location
          ? `${e.location} • ${e.eventType || ""}`
          : e.eventType || "",
        refId: String(e._id),
        eventId: String(e._id),
        meta: {
          date: e.date || null,
          duration: e.duration || null,
          trainerOnly: !!e.trainerOnly,
        },
      })
    );

    // -------------------------
    // WORKOUTS (AddWork library)
    // -------------------------
    // trainer -> general OR trainerId=me
    // admin -> all
    // user -> only general
    let workoutScope = {};
    if (role === "admin") {
      workoutScope = {};
    } else if (role === "personal_trainer") {
      workoutScope = {
        $or: [{ isGeneral: true }, { trainerId: req.user._id }],
      };
    } else {
      workoutScope = { isGeneral: true };
    }

    const workouts = await AddWork.find({
      ...workoutScope,
      $or: [{ workoutName: q }, { description: q }, { type: q }],
    })
      .select("_id workoutName type workoutLevel trainerId isGeneral")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const workoutResults = workouts.map((w) =>
      buildResult({
        type: "workout",
        title: w.workoutName || "Workout",
        subtitle: `${w.type || "type"} • ${w.workoutLevel || "level"}${
          w.isGeneral ? " • general" : ""
        }`,
        refId: String(w._id),
        workoutId: String(w._id),
        meta: {
          isGeneral: !!w.isGeneral,
          trainerId: w.trainerId ? String(w.trainerId) : "",
        },
      })
    );

    // FLAT LIST (SearchBar expects array)
    const merged = [
      ...userResults,
      ...noteResults.slice(0, 8),
      ...medicalResults.slice(0, 8),
      ...eventResults,
      ...workoutResults,
    ].slice(0, 25);

    return res.status(200).json(merged);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ message: "Search failed." });
  }
};

module.exports = {
  globalSearch,
};
