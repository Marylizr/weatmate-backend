const express = require('express');
const  {preWorkoutController } = require('../controllers')
const preWorkoutRouter = express.Router();



preWorkoutRouter.get('/', preWorkoutController.findAll);

preWorkoutRouter.get('/:id', preWorkoutController.findOne);

preWorkoutRouter.post('/',  preWorkoutController.create)

preWorkoutRouter.delete('/:id', preWorkoutController.delete);

preWorkoutRouter.put('/', preWorkoutController.update);


module.exports =  preWorkoutRouter ; 