// const db = require('./mongo');
const AddWork = require('../models/addWorkoutModel');


   exports.findAll = async (req, res) =>{
      res.status(200).json(await AddWork.find());
   };

   exports.delete = (req,res) => { 
   const id = req.params.id;
   AddWork.findByIdAndDelete(id, {}, (error, result) => {
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
      res.status(200).json(await AddWork.findOne(req.params.name));
   }

   
   exports.create = async (req, res) => {
   const data = req.body;
   const dataPosted = {
      type: data.type,
      workoutName: data.workoutName,
      description: data.description,
      reps: data.reps,
      series: data.series,
      lidted: data.lifted,
      picture: data.picture,
      video: data.video
   }
   
  const newWorkout = new AddWork(dataPosted);

  await newWorkout.save()

  console.log(newWorkout, 'Creating new Workout');

  res.json({Message: "Your new workout was created Succesfully", newWorkout});
    
  };


  exports.update = async(req, res) => {
   const id = req.params.id;
   const data = req.body;
 
   const updatedWorkout = await AddWork.findOneAndUpdate(id, data)
 
   res.status(200).json({message: "Your Product has been updated Succesfully", updatedWorkout})
 }






