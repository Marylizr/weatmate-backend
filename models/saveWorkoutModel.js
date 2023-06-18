const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const saveWorkSchema = new Schema({
  type: String,
  name: String,
  reps: Number,
  series: Number,
  weight: Number,
  date: { type: Date, default: Date.now }

});

const SaveWork = mongoose.model("saveWork", saveWorkSchema);

module.exports = SaveWork;