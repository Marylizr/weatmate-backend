const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const DesignedByPtSchema = new Schema({
    userName: String,
    type: String,
    name: String,
    description: String,
    lifted: Number,
    reps: Number,
    series: Number,
    date: { type: Date, default: Date.now },
    picture: String,
    video: String

});

const DesignedByPt = mongoose.model("designedByPt", DesignedByPtSchema);

module.exports = DesignedByPt;