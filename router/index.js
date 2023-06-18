const express = require('express');
const appRouter = express.Router();

const { UserRouter } = require('../router/userRouter');
const LoginRouter  = require('../router/loginRouter');
const {AddWorkoutRouter} = require('../router/addWorkoutRouter');
const { SaveWorkRouter } = require ('../router/saveWorkoutRouter');
const { FavRouter } = require('../router/favRouter');
const {MessageRouter} = require('../router/contactRouter');
const{ chatRouter} = require('../router/chatRouter');


appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/savechat', SaveWorkRouter);
appRouter.use('/fav', FavRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/', LoginRouter);
appRouter.use('/contact', MessageRouter);
appRouter.use('/', chatRouter);


module.exports = appRouter;