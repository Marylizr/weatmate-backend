const express = require('express');

const { AddWorkoutRouter } = require('../router/addWorkoutRouter');
const { UserRouter } = require('../router/userRouter');
const  LoginRouter  = require('../router/loginRouter'); 


const appRouter = express.Router();

appRouter.use('/workouts', AddWorkoutRouter);
appRouter.use('/user', UserRouter);
appRouter.use('/', LoginRouter );


module.exports = appRouter;