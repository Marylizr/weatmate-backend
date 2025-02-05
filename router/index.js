const express = require('express');
const appRouter = express.Router();

const { UserRouter } = require('../router/userRouter');
const LoginRouter  = require('../router/loginRouter');
const {AddWorkoutRouter} = require('../router/addWorkoutRouter');
const { SaveWorkRouter } = require ('../router/saveWorkoutRouter');
const  FavRouter  = require('../router/favRouter');
const {MessageRouter} = require('../router/contactRouter');
const chatRouter = require('../router/chatRouter');
const { ProgressRouter } = require('./progressRouter');
const { DesignedByPtRouter }  = require('../router/designedByPtRouter');
const { EventRouter }  = require('../router/eventRouter');
const { PreWorkoutRouter } = require('./preWorkoutRouter');
const { MealPlanRouter } = require('./mealPlanRouter');
const  MoodTrackerRouter  = require('./moodTrackerRouter');
const  GoalRouter  = require('./goalRouter');
const   verifyEmailRouter  = require('./authRoutes');
const menstrualCycleRouter = require('./menstrualCycleRouter');
const  passwordRouter = require('./resetPasswordRouter');


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
appRouter.use('/mealPlan', MealPlanRouter);
appRouter.use('/moodTracker', MoodTrackerRouter);
appRouter.use('/goals', GoalRouter);
appRouter.use('/auth', verifyEmailRouter);
appRouter.use('/menstrualCycle', menstrualCycleRouter);
appRouter.use('/', passwordRouter);



// Debug middleware for incoming requests
appRouter.use((req, res, next) => {
   console.log(`Request received: ${req.method} ${req.url}`);
   next();
 });
 
 // Fallback for unhandled routes
 appRouter.use((req, res) => {
   res.status(404).json({ message: 'Route not found' });
 });
 

module.exports = appRouter;