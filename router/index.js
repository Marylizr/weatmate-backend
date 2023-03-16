const express = require('express');
const appRouter = express.Router(); 

const { AddWorkoutRouter } = require('../router/addWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const { UserRouter } = require('../router/usersRouter');
const { SaveWorkRouter } = require('./saveWorkoutRouter'); 
const {MessageRouter } = require('../router/contactRouter');
const LoginRouter = require('../router/loginRouter');



appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/saveworkout', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/contact', MessageRouter);
appRouter.use('/', LoginRouter);


module.exports = appRouter;