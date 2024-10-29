const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  eventType: {
    type: String,
    required: true,
    enum: ["personal_training", "group_class", "gathering"]
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
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: false // Optional, can be null for trainer-only events
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  trainerOnly: {
    type: Boolean, // This indicates if the event is trainer-only
    default: false // Default is false unless explicitly set
  },
  status: {
    type: String,
    enum: ["pending", "completed", "canceled"], // Status options for the event
    default: "pending" // Default to pending
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
