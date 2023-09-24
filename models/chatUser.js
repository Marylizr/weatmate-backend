const crypto = require ('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;



const ChatUserSchema = new Schema ({

   content: String,
   picture: String,

   userName: {
      type: String,
      unique: false,
   },

   infotype: {
      type: String,
      enum: ["healthy-tips", "recipes", "workouts"],
   },
   password: {
      type: String,
   },
   salt: {
      type: String,
      
   }
}, {
   timestamp: true
});

ChatUserSchema.methods.setPassword = function(password) {
   this.salt = crypto.randomBytes(16).toString("hex");

   this.password = crypto.pbkdf2Sync(
      password,
      this.salt,
      1000,
      64,
      "sha512",
   ).toString("hex")
};

ChatUserSchema.methods.validPassword = function (password) {
   const hash = crypto.pbkdf2Sync(
     password,
     this.salt,
     1000,
     64,
     "sha512"
   ).toString("hex");
 
   return this.password === hash;
 };


const ChatUser = mongoose.model("chatUser", ChatUserSchema);
module.exports = ChatUser;


