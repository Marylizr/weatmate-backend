const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
   name: String,
   email: String,
   password: String,
   image: String,
   age: Number,
   height: Number,
   Weight: Number,
   goal: String
});

var User = model("user", UserSchema);

module.exports = User;