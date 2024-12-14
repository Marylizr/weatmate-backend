const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  image: String,
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'You must be at least 18 years old'],
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
   enum: ["basic", "admin", "personal-trainer"] 
  },
  token: String,
  gender: {
    type: String,
    enum: ['female', 'male'],
    required: [true, 'Gender is required'],
  },
  fitness_level: {
    type: String,
    enum:["beginner", "medium", "advanced"]
  },
  // Admin-specific fields
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
