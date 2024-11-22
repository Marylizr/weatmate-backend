const express = require('express');
const  {PreWorkoutController } = require('../controllers')
const PreWorkoutRouter = express.Router();



PreWorkoutRouter.get('/', PreWorkoutController.findAll);

PreWorkoutRouter.get('/:id', PreWorkoutController.findOne);

PreWorkoutRouter.post('/',  PreWorkoutController.create)

PreWorkoutRouter.delete('/:id', PreWorkoutController.delete);

PreWorkoutRouter.put('/', PreWorkoutController.update);


module.exports = { PreWorkoutRouter }; 