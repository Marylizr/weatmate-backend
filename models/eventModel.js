const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  eventType: {
    type: String,
    required: true,
    enum: ["personal_training", "group_class", "gathering", "other"] // Added 'other'
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  userId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User', // Ensure this points to the User model
      required: function () { return !this.trainerOnly; } // Only required if NOT trainer-only
    },
  ],
  customerEmail: {
    type: String, // To store the customer's email for sending confirmations
    required: false
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  trainerOnly: {
    type: Boolean, // Indicates if the event is trainer-only
    default: false
  },
  status: {
    type: String,
    enum: ["pending", "completed", "canceled"],
    default: "pending"
  },
  confirmationStatus: {
    type: String,
    enum: ["not_sent", "sent", "confirmed"],
    default: "not_sent" // Track the status of the email confirmation
  },
  rescheduleHistory: [
    {
      previousDate: Date,
      rescheduledAt: { type: Date, default: Date.now } // Timestamp of when the reschedule happened
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
