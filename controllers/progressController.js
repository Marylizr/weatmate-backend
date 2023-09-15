const express = require('express');
const Progress = require('../models/progessModel');


exports.findAll = async (req, res) =>{
   res.status(200).json(await Progress.find());
};

exports.delete = (req,res) => { 
const id = req.params.id;
Progress.findByIdAndDelete(id, {}, (error, result) => {
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
   res.status(200).json(await Progress.findOne(req.params.date));
}


exports.create = async (req, res) => {
const data = req.body;
const dataPosted = {
   weight: data.weight,
   waist: data.waist,
   hips: data.hips,
   chest: data.chest,
   bodyFat: data.bodyFat,
   date: data.date,
   note:data.note,
   picture: data.picture,
}

const newProgress = new Progress(dataPosted);

await newProgress.save()
console.log(newProgress, 'Your update has been saved')
res.json({Message: 'Your update has been saved', newProgress});
};


exports.update = async(req, res) => {
const id = req.params.id;
const data = req.body;

const updatedData = await Progress.findOneAndUpdate(id, data)
console.log('your info has been updated suscessfully', updatedData)
res.status(200).json({message: "Your Favs has been updated Succesfully", updatedData})
}