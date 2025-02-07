const express = require('express');
const appRouter = express.Router();

const userRouter = require('../router/userRouter')
const loginRouter  = require('../router/loginRouter');
const {addWorkoutRouter} = require('../router/addWorkoutRouter');
const saveWorkourRouter = require('../router/saveWorkoutRouter')
const  favRouter  = require('../router/favRouter');
const {contactRouter} = require('../router/contactRouter');
const chatRouter = require('../router/chatRouter');
const progressRouter = require('../router/progressRouter')
const { designedByPtRouter }  = require('../router/designedByPtRouter');
const { eventRouter }  = require('../router/eventRouter');
const  preWorkoutRouter = require('../router/preWorkoutRouter');
const mealPlanRouter = require('../router/mealPlanRouter')
const  moodTrackerRouter  = require('./moodTrackerRouter');
const  goalRouter  = require('./goalRouter');
const   verifyEmailRouter  = require('./authRoutes');
const menstrualCycleRouter = require('./menstrualCycleRouter');
const  passwordRouter = require('./resetPasswordRouter');


appRouter.use('/', loginRouter);
appRouter.use('/workouts', addWorkoutRouter);
appRouter.use('/saveworkout', saveWorkourRouter);
appRouter.use('/fav', favRouter);
appRouter.use('/user', userRouter);
appRouter.use('/contact', contactRouter);
appRouter.use('/', chatRouter);
appRouter.use('/progress', progressRouter);
appRouter.use('/personaltrainer', designedByPtRouter);
appRouter.use('/events', eventRouter);
appRouter.use('/preWorkout', preWorkoutRouter);
appRouter.use('/mealPlan', mealPlanRouter);
appRouter.use('/moodTracker', moodTrackerRouter);
appRouter.use('/goals', goalRouter);
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

 // Add this to handle the root URL
 appRouter.get('/', (req, res) => {
  res.send('Welcome to SweatMate API!');
});

 

module.exports = appRouter;