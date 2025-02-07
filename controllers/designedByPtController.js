const DesignedByPt = require('../models/designedByPtModel');


exports.findAll = async (req, res) =>{
   res.status(200).json(await DesignedByPt.find());
};

exports.delete = (req,res) => { 
const id = req.params.id;
DesignedByPt.findByIdAndDelete(id, {}, (error, result) => {
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
   res.status(200).json(await DesignedByPt.findOne(req.params.name));
}


exports.create = async (req, res) => {
const data = req.body;
const dataPosted = {
   name:data.name,
   type: data.type,
   workoutName: data.workoutName,
   description: data.description,
   reps: data.reps,
   lifted: data.lifted,
   date: data.date,
   series: data.series,
   picture: data.picture,
   video: data.video
}

const newDesign = new DesignedByPt(dataPosted);

await newDesign.save()
console.log(newDesign, 'Your new Workout has been created')
res.json({Message: "Your new workout was created Succesfully", newDesign});
};


exports.update = async(req, res) => {
const id = req.params.id;
const data = req.body;

const updatedDesign = await DesignedByPt.findOneAndUpdate(id, data)

res.status(200).json({message: "Your workout has been updated Succesfully", updatedDesign})
}

