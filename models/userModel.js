const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   name: String,
   email: String,
   password: String,
   image: String,
   age: Number,
   height: Number,
   weight: Number,
   goal: String,
   role: {
      type: String,
      default: 'basic',
      enum: ["basic", "supervisor", "admin"]
   },
   token: {
      type: String
   },
   gender: {
      type: String,
      enum: ["female", "male"]
   },
   // Admin-specific fields
   degree: {
      type: String,
      function() { return this.role === 'admin'; }  // Only required for admin
   },
   experience: {
      type: Number,
      function() { return this.role === 'admin'; }
   },
   specializations: {
      type: String,
      function() { return this.role === 'admin'; }
   },
   bio: {
      type: String,
      function() { return this.role === 'admin'; }
   },
   location: {
      type: String,
      function() { return this.role === 'admin'; }
   }
   
} , { timestamps: true });

module.exports = mongoose.model('User', UserSchema);


