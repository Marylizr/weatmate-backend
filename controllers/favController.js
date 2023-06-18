const express = require('express');
const Fav = require('../models/favModel');


exports.findAll = async (req, res) =>{
   res.status(200).json(await Fav.find());
};

exports.delete = (req,res) => { 
const id = req.params.id;
Fav.findByIdAndDelete(id, {}, (error, result) => {
   if(error){
      res.status(500).json({error: error.message});
   } else if(!result){
      res.status(404);
   }else{
      res.status(204).send();
   }
})
};

exports.findOne = async (req, res) => {
   res.status(200).json(await Fav.findOne(req.params.name));
}


exports.create = async (req, res) => {
const data = req.body;
const dataPosted = {
   type: data.type,
   name: data.name,
   description: data.description,
   reps: data.reps,
   weight: data.weight,
   date: data.date,
   series: data.series,
   picture: data.picture,
   video: data.video
}

const newFav = new Fav(dataPosted);

await newFav.save()

console.log('Creating new fav workout');

res.json({Message: "Your new fav workout was created Succesfully", newFav});
 
};


exports.update = async(req, res) => {
const id = req.params.id;
const data = req.body;

const updatedWorkout = await Fav.findOneAndUpdate(id, data)

res.status(200).json({message: "Your Favs has been updated Succesfully", updatedWorkout})
}