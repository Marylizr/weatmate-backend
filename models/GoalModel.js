const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoalSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    
  },
  goalType: {
    type: String,
    enum: ['weight', 'strength', 'endurance', 'custom'],
   
  },
  targetValue: {
    type: Number,
    
  },
  currentValue: {
    type: Number,
    default: 0
  },
  personalNotes:[
   {
   type: String
  }
   ],
  progressHistory: [
    {
      date: { type: Date, default: Date.now },
      value: Number
    }
  ],
  milestones: [
    {
      milestoneValue: Number,
      achievedAt: Date
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', GoalSchema);
