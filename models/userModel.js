const { Schema, model } = require('mongoose');

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
     }
});

var User = model("user", UserSchema);

module.exports = User;