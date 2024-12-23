const crypto = require("crypto");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const ChatUserSchema = new Schema({
  content: String,
  picture: String,

  name: {
    type: String,
    unique: false,
  },

  infotype: {
    type: String,
    enum: ["healthy-tips", "recipes", "workouts"], // Main content type
  },

  // Subcategory for recipes
  recipeCategory: {
    type: String,
    enum: ["vegan", "vegetarian", "keto", "paleo", "gluten-free", "mediterranean", "low-carb"],
    required: function () {
      return this.infotype === "recipes"; // Only required for recipes
    },
  },

  // Level for workouts
  workoutLevel: {
    type: String,
    enum: ["basic", "medium", "advanced"],
    required: function () {
      return this.infotype === "workouts"; // Only required for workouts
    },
  },

  password: {
    type: String,
  },

  salt: {
    type: String,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

// Method to set hashed password
ChatUserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");

  this.password = crypto.pbkdf2Sync(
    password,
    this.salt,
    1000,
    64,
    "sha512"
  ).toString("hex");
};

// Method to validate password
ChatUserSchema.methods.validPassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");

  return this.password === hash;
};

const ChatUser = mongoose.model("chatUser", ChatUserSchema);
module.exports = ChatUser;
