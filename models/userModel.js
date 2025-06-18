const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicalHistoryEntry = new Schema({
  history:   { type: String, required: true },
  date:      { type: Date,   required: true },
  pdfUrl:    { type: String },
  analysis: {
    summary:    { type: String },
    conditions: [
      {
        name:          String,
        value:         String,
        normalRange:   String,
        severity:      String,
        recommendation:String,
      }
    ],
  },
});

const UserSchema = new Schema({
  name:           { type: String, required: [true, 'Name is required'] },
  image:          { type: String },
  email:          {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  isVerified:     { type: Boolean, default: false },
  emailToken:     { type: String },
  password:       { type: String, required: [true, 'Password is required'] },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  age:            { type: Number, required: [true, 'Age is required'], min: [15, 'You must be at least 15'] },
  height:         { type: Number, required: [true, 'Height is required'], min: [0, 'Height must be positive'] },
  weight:         { type: Number, required: [true, 'Weight is required'], min: [0, 'Weight must be positive'] },
  goal:           { type: String, required: [true, 'Goal is required'] },
  role:           { type: String, default: 'basic', enum: ['basic','admin','personal-trainer'] },
  token:          { type: String },
  gender:         { type: String, enum: ['female','male'], required: [true,'Gender is required'] },
  fitness_level:  { type: String, enum:['beginner','intermediate','advanced'] },

  medicalHistory: [MedicalHistoryEntry],

  preferences: [
    { preference: { type: String, required: true }, date: { type: Date, default: Date.now } }
  ],

  sessionNotes: [
    { note: { type: String, required: true }, date: { type: Date, default: Date.now } }
  ],

  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  degree:          { type: String },
  experience:      { type: Number },
  specializations: { type: String },
  bio:             { type: String },
  location:        { type: String },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
