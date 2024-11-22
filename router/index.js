const express = require('express');
const appRouter = express.Router();

const { UserRouter } = require('../router/userRouter');
const LoginRouter  = require('../router/loginRouter');
const {AddWorkoutRouter} = require('../router/addWorkoutRouter');
const { SaveWorkRouter } = require ('../router/saveWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const {MessageRouter} = require('../router/contactRouter');
const chatRouter = require('../router/chatRouter');
const { ProgressRouter } = require('./progressRouter');
const { DesignedByPtRouter }  = require('../router/designedByPtRouter');
const { EventRouter }  = require('../router/eventRouter');
const { PreWorkoutRouter } = require('./preWorkoutRouter');


appRouter.use('/', LoginRouter);
appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/saveworkout', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/contact', MessageRouter);
appRouter.use('/', chatRouter);
appRouter.use('/progress', ProgressRouter);
appRouter.use('/personaltrainer', DesignedByPtRouter);
appRouter.use('/events', EventRouter);
appRouter.use('/preWorkout', PreWorkoutRouter);


module.exports = appRouter;