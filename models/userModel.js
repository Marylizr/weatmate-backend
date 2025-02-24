const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  image:{
    type:String
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  }, // Email verification status

  emailToken: { 
    type: String 
  }, // Token for email confirmation
  
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  resetPasswordToken: 
  { 
    type: String 
  },
  resetPasswordExpire: 
  { 
    type: Date 
  },

  image: String,
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [15, 'You must be at least 15 years old'],
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [0, 'Height must be a positive number'],
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight must be a positive number'],
  },
  goal: {
    type: String,
    required: [true, 'Goal is required'],
  },
  role: {
    type: String,
    default: 'basic',
    enum: ["basic", "admin", "personal-trainer"], 
  },
  token: String,
  gender: {
    type: String,
    enum: ['female', 'male'],
    required: [true, 'Gender is required'],
  },
  fitness_level: {
    type: String,
    enum:["beginner", "intermediate", "advanced"]
  },

  medicalHistory: [
    {
      history: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  
  preferences: [
    {
      preference: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],

  sessionNotes: [
    {
      note: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],

  // Reference to the personal trainer
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the User model
  },

  // Admin / personal trainer -specific fields
  degree: {
    type: String,
  },
  experience: {
    type: Number,
  },
  specializations: {
    type: String,
  },
  bio: {
    type: String,
  },
  location: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);