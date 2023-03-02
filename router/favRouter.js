const express = require('express');
const {FavController } = require('../controllers')
const FavRouter = express.Router();



FavRouter.get('/', FavController.findAll);

FavRouter.get('/:id', FavController.findOne);

FavRouter.post('/',  FavController.create)

FavRouter.delete('/:id', FavController.delete);

FavRouter.patch('/', FavController.update);

FavRouter.put('/', FavController.update);


module.exports = { FavRouter };