const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const saveWorkSchema = new Schema({
  workout_type: String,
  description: String,
  reps: Number,
  series: Number,
  date: { type: Date, default: Date.now }

});

const SaveWorkSchema = mongoose.model("saveWork", saveWorkSchema);

module.exports = SaveWorkSchema;