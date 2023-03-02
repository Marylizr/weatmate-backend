const { Schema, model } = require('mongoose');


const favSchema = new Schema({ 
   type: String,
   name: String,
   description: String,
   reps: Number,
   series: Number,
   picture: String,
   video: String
});


const Fav = model ('fav', favSchema);

module.exports = Fav;