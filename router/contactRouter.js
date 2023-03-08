const express = require('express');
const  {MessageController}  = require('../controllers')
const MessageRouter = express.Router();



MessageRouter.get('/', MessageController.findAll);

MessageRouter.get('/:id', MessageController.findOne);

MessageRouter.post('/',  MessageController.create)

MessageRouter.delete('/:id', MessageController.delete);


module.exports = { MessageRouter }; 