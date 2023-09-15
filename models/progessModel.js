const { Schema, model } = require('mongoose');


const progressSchema = new Schema({ 
   weight: String,
   waist: String,
   hips: String,
   chest:String,
   bodyFat: String,
   note: String,
   date: { type: Date, default: Date.now },
   picture: String,
});


const Progress = model ('progress', progressSchema);

module.exports = Progress;