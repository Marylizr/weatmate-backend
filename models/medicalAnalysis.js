const mongoose = require('mongoose');
const { Schema } = mongoose;

const MedicalAnalysisSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  entryDate: { type: Date, required: true },
  text: { type: String, required: true },
  alerts: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('MedicalAnalysis', MedicalAnalysisSchema);
