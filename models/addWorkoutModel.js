const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const addWorkSchema = new Schema({
  type: String,
  name: String,
  description: String,
  reps: Number,
  series: Number,
  lifted: Number,
  picture: String,
  video: String,
});

const AddWork = mongoose.model("addwork", addWorkSchema);

module.exports = AddWork;