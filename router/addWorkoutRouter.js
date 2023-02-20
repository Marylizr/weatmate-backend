const express = require('express');
const { AddWorkoutController } = require('../controllers')
const AddWorkoutRouter = express.Router();



AddWorkoutRouter.get('/', AddWorkoutController.findAll);

AddWorkoutRouter.get('/:id', AddWorkoutController.findOne);

AddWorkoutRouter.post('/',  AddWorkoutController.create)

AddWorkoutRouter.get('/me',  AddWorkoutController.findOne);

AddWorkoutRouter.delete('/:id', AddWorkoutController.delete);

AddWorkoutRouter.patch('/', AddWorkoutController.update);

AddWorkoutRouter.put('/',AddWorkoutController.update);


module.exports = { AddWorkoutRouter };