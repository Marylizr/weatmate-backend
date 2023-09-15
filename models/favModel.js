const { Schema, model } = require('mongoose');


const favSchema = new Schema({ 
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


const Fav = model ('fav', favSchema);

module.exports = Fav;