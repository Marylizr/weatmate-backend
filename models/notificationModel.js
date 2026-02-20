const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["user", "role", "many"],
      required: true,
    },

    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    recipientRole: {
      type: String,
      enum: ["admin", "personal-trainer", "basic"],
      default: null,
    },

    recipientUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, default: "" },

    route: { type: String, default: "" },

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },

    related: {
      entityType: { type: String, default: "" },
      entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", NotificationSchema);
