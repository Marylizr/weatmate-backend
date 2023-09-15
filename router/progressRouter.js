const express = require('express');
const { ProgressController } = require('../controllers');
const ProgressRouter = express.Router();



ProgressRouter.get('/', ProgressController.findAll);

ProgressRouter.get('/:id', ProgressController.findOne);

ProgressRouter.post('/',  ProgressController.create)

ProgressRouter.delete('/:id', ProgressController.delete);

ProgressRouter.patch('/', ProgressController.update);

ProgressRouter.put('/', ProgressController.update);


module.exports = { ProgressRouter };