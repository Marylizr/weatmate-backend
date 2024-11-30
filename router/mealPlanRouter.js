const express = require('express');
const  {MealPlanController } = require('../controllers')
const MealPlanRouter = express.Router();



MealPlanRouter.get('/', MealPlanController.findAll);

MealPlanRouter.get('/:id', MealPlanController.getMealPlans);

MealPlanRouter.post('/',  MealPlanController.create)

MealPlanRouter.delete('/:id', MealPlanController.delete);

MealPlanRouter.put('/', MealPlanController.update);


module.exports = { MealPlanRouter }; 