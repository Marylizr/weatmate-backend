const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
   name: String,
   email: String,
   password: String,
   image: String,
   age: Number,
   height: Number,
   weight: String,
   goals: String,
   role: {
      type: String,
      default: 'basic',
      enum: ["basic", "supervisor", "admin"]
     },
     accessToken: {
      type: String
     }
});

const User = mongoose.model("user", userSchema);

module.exports = User;