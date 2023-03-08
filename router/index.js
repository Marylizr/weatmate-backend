const express = require('express');
const appRouter = express.Router(); 

const { AddWorkoutRouter } = require('../router/addWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const { router } = require('../router/userRouter');
const { SaveWorkRouter } = require('./saveWorkoutRouter'); 
const {MessageRouter } = require('../router/contactRouter');



appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/saveworkout', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', router);
appRouter.use('/contact', MessageRouter)


module.exports = appRouter;