const express = require('express');
const  designedByPtController  = require('../controllers/designedByPtController')
const designedByPtRouter = express.Router();



designedByPtRouter.get('/', designedByPtController.findAll);

designedByPtRouter.get('/:id', designedByPtController.findOne);

designedByPtRouter.post('/',  designedByPtController.create)

designedByPtRouter.delete('/:id', designedByPtController.delete);

designedByPtRouter.patch('/', designedByPtController.update);

designedByPtRouter.put('/', designedByPtController.update);


module.exports = { designedByPtRouter }; 