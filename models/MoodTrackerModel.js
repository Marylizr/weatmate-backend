const mongoose = require('mongoose');

const MoodTrackerSchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mood: {
    type: String,
    required: true,
    enum: ['Happy', 'Sad', 'Stressed', 'Anxious', 'Excited', 'Tired', 'Other'],
  },
  comments: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  suggestions: {
    workout: {
      type: String,
      default: '',
    },
    playlist: {
      type: String,
      default: '',
    },
    motivationalMessage: {
      type: String,
      default: '',
    },
  },
  menstrualCyclePhase: {
    // Optional, only applicable for women
    type: String,
    enum: ['Menstruation', 'Follicular', 'Ovulation', 'Luteal', 'Unknown'],
    default: 'Unknown',
  },
});

module.exports = mongoose.model('MoodTracker', MoodTrackerSchema);
