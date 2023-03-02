const express = require('express');

const { AddWorkoutRouter } = require('../router/addWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const { UserRouter } = require('./userRouter');
const { SaveWorkRouter } = require('./saveWorkoutRouter');
const  LoginRouter  = require('../router/loginRouter'); 


const appRouter = express.Router(); 

appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/saveworkout', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/', LoginRouter );


module.exports = appRouter;