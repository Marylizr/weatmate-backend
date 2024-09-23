const express = require('express');
const  {DesignedByPtController}  = require('../controllers')
const DesignedByPtRouter = express.Router();



DesignedByPtRouter.get('/', DesignedByPtController.findAll);

DesignedByPtRouter.get('/:id', DesignedByPtController.findOne);

DesignedByPtRouter.post('/',  DesignedByPtController.create)

DesignedByPtRouter.delete('/:id', DesignedByPtController.delete);

DesignedByPtRouter.patch('/', DesignedByPtController.update);

DesignedByPtRouter.put('/', DesignedByPtController.update);


module.exports = { DesignedByPtRouter }; 