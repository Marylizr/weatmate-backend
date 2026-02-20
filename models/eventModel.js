const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RescheduleHistorySchema = new Schema(
  {
    previousDate: { type: Date, required: true },
    newDate: { type: Date, required: true },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: { type: String, default: "" },

    decision: {
      type: String,
      enum: ["accepted", "rejected"],
      required: true,
    },

    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
  },
  { _id: false },
);

const EventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ["personal_training", "group_class", "gathering", "other"],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: function () {
          return !this.trainerOnly;
        },
        index: true,
      },
    ],

    confirmedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    declinedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    customerEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },

    location: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    trainerOnly: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
      index: true,
    },

    confirmationStatus: {
      type: String,
      enum: ["not_sent", "sent", "confirmed"],
      default: "not_sent",
      index: true,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    rescheduleRequest: {
      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      proposedDate: {
        type: Date,
        default: null,
      },

      note: {
        type: String,
        default: "",
        trim: true,
      },

      status: {
        type: String,
        enum: ["none", "pending", "accepted", "rejected"],
        default: "none",
        index: true,
      },

      respondedAt: {
        type: Date,
        default: null,
      },
    },

    rescheduleHistory: [RescheduleHistorySchema],
  },
  { timestamps: true },
);

/* -------------------------
   Indexes for performance
-------------------------- */

// Trainer calendar queries
EventSchema.index({ trainerId: 1, date: 1 });

// Client dashboard queries
EventSchema.index({ userId: 1, date: 1 });

// Pending reschedule triage (trainer)
EventSchema.index({ trainerId: 1, "rescheduleRequest.status": 1, date: 1 });

/* -------------------------
   Data integrity helpers
-------------------------- */

EventSchema.pre("save", function (next) {
  // Ensure no user is both confirmed and declined
  const confirmed = new Set((this.confirmedUsers || []).map(String));
  const declined = new Set((this.declinedUsers || []).map(String));

  // Remove overlaps from declined (confirmed wins)
  for (const id of confirmed) {
    if (declined.has(id)) declined.delete(id);
  }

  this.declinedUsers = Array.from(declined);

  // If reschedule status is pending, proposedDate must exist
  if (
    this.rescheduleRequest?.status === "pending" &&
    !this.rescheduleRequest?.proposedDate
  ) {
    return next(
      new Error(
        "rescheduleRequest.proposedDate is required when status is pending",
      ),
    );
  }

  // If reschedule status is none, clean fields
  if (this.rescheduleRequest?.status === "none") {
    this.rescheduleRequest.requestedBy = null;
    this.rescheduleRequest.proposedDate = null;
    this.rescheduleRequest.note = "";
    this.rescheduleRequest.respondedAt = null;
  }

  next();
});

module.exports = mongoose.model("Event", EventSchema);
