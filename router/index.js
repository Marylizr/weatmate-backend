const express = require('express');
const appRouter = express.Router(); 

const { AddWorkoutRouter } = require('../router/addWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const { UserRouter } = require('../router/userRouter');
const { SaveWorkRouter } = require('./saveWorkoutRouter'); 
const {MessageRouter } = require('../router/contactRouter');



appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/saveworkout', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/contact', MessageRouter)


module.exports = appRouter;