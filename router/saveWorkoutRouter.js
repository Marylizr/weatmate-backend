const express = require('express');
const  {SaveWorkController}  = require('../controllers')
const SaveWorkRouter = express.Router();



SaveWorkRouter.get('/', SaveWorkController.findAll);

SaveWorkRouter.get('/:id', SaveWorkController.findOne);

SaveWorkRouter.post('/',  SaveWorkController.create)

SaveWorkRouter.delete('/:id', SaveWorkController.delete);

SaveWorkRouter.patch('/', SaveWorkController.update);

SaveWorkRouter.put('/', SaveWorkController.update);


module.exports = { SaveWorkRouter }; 