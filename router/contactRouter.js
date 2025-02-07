const express = require('express');
const  contactController = require('../controllers/contactController')
const contactRouter = express.Router();



contactRouter.get('/', contactController.findAll);

contactRouter.get('/:id', contactController.findOne);

contactRouter.post('/',  contactController.create)

contactRouter.delete('/:id', contactController.delete);


module.exports = { contactRouter }; 