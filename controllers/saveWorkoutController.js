// const db = require('./mongo');
const SaveWork = require('../models/saveWorkoutModel');


   exports.findAll = async (req, res) =>{
      res.status(200).json(await SaveWork.find());
   };

   exports.delete = (req,res) => { 
   const id = req.params.id;
   SaveWork.findByIdAndDelete(id, {}, (error, result) => {
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
      res.status(200).json(await SaveWork.findOne(req.params.name));
   }

   
   exports.create = async (req, res) => {
   const data = req.body;
   const dataPosted = {
      type: data.type,
      name: data.name,
      reps: data.reps,
      series: data.series,
      date: data.date
   }
   
  const newSavedWork = new SaveWork(dataPosted);

  await newSavedWork.save()

  console.log('saving your Workout');

  res.json({Message: "Your new workout was saved Succesfully", newSavedWork});
    
  };


  exports.update = async(req, res) => {
   const id = req.params.id;
   const data = req.body;
 
   const updatedWorkout = await SaveWork.findOneAndUpdate(id, data)
 
   res.status(200).json({message: "Your Workout has been updated Succesfully", updatedWorkout})
 }






