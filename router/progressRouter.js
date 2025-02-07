const express = require('express');
const progressController = require('../controllers/progressController')
const progressRouter = express.Router();



progressRouter.get('/', progressController.findAll);

progressRouter.get('/:id', progressController.findOne);

progressRouter.post('/',  progressController.create)

progressRouter.delete('/:id', progressController.delete);

progressRouter.patch('/', progressController.update);

progressRouter.put('/', progressController.update);


module.exports =  progressRouter ;