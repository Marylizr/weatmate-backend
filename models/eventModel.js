const { Schema, model } = require('mongoose');

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
    ref: 'user', // Assuming 'user' model has trainer details
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: false // Make userId optional
  },
  location: {
    type: String
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = model('event', EventSchema);
