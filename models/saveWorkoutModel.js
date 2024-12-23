const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const saveWorkSchema = new Schema({
    name: String,
    type: String,
    wokoutName: String,
    description: String,
    lifted: Number,
    reps: Number,
    series: Number,
    date: { type: Date, default: Date.now },
    picture: String,
    video: String

});

const SaveWork = mongoose.model("saveWork", saveWorkSchema);

module.exports = SaveWork;