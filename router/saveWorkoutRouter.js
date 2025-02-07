const express = require('express');
const  saveWorkController = require('../controllers/saveWorkoutController')
const saveWorkRouter = express.Router();



saveWorkRouter.get('/', saveWorkController.findAll);

saveWorkRouter.get('/:id', saveWorkController.findOne);

saveWorkRouter.post('/',  saveWorkController.create)

saveWorkRouter.delete('/:id', saveWorkController.delete);

saveWorkRouter.patch('/', saveWorkController.update);

saveWorkRouter.put('/', saveWorkController.update);


module.exports =  saveWorkRouter ; 