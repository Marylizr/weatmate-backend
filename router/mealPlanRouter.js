const express = require('express');
const  mealPlanController  = require('../controllers/mealPlantController')
const mealPlanRouter = express.Router();



mealPlanRouter.get('/', mealPlanController.findAll);

mealPlanRouter.get('/:id', mealPlanController.getMealPlans);

mealPlanRouter.post('/',  mealPlanController.create)

mealPlanRouter.delete('/:id', mealPlanController.delete);

mealPlanRouter.put('/', mealPlanController.update);


module.exports =  mealPlanRouter ; 