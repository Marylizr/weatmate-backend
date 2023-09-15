const { Schema, model } = require('mongoose');


const progressSchema = new Schema({ 
   name: String,
   userId:String,
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