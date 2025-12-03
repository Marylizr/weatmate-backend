const express = require("express");
const appRouter = express.Router();

const userRouter = require("../router/userRouter");
const loginRouter = require("../router/loginRouter");
const { addWorkoutRouter } = require("../router/addWorkoutRouter");
const saveWorkoutRouter = require("../router/saveWorkoutRouter");
const favRouter = require("../router/favRouter");
const { contactRouter } = require("../router/contactRouter");
const chatRouter = require("../router/chatRouter");
const progressRouter = require("../router/progressRouter");
const { designedByPtRouter } = require("../router/designedByPtRouter");
const { eventRouter } = require("../router/eventRouter");
const preWorkoutRouter = require("../router/preWorkoutRouter");
const mealPlanRouter = require("../router/mealPlanRouter");
const moodTrackerRouter = require("./moodTrackerRouter");
const goalRouter = require("./goalRouter");
const verifyEmailRouter = require("./authRoutes");
const menstrualCycleRouter = require("./menstrualCycleRouter");
const passwordRouter = require("./resetPasswordRouter");
const nutritionRouter = require("./nutritionRouter");

appRouter.use((req, res, next) => {
  console.log(` Request: ${req.method} ${req.originalUrl}`);
  next();
});

appRouter.use("/", loginRouter);
appRouter.use("/workouts", addWorkoutRouter);
appRouter.use("/saveworkout", saveWorkoutRouter);
appRouter.use("/fav", favRouter);
appRouter.use("/user", userRouter);
appRouter.use("/contact", contactRouter);
appRouter.use("/", chatRouter);
appRouter.use("/progress", progressRouter);
appRouter.use("/personaltrainer", designedByPtRouter);
appRouter.use("/events", eventRouter);
appRouter.use("/preWorkout", preWorkoutRouter);
appRouter.use("/mealPlan", mealPlanRouter);
appRouter.use("/moodTracker", moodTrackerRouter);
appRouter.use("/goals", goalRouter);
appRouter.use("/auth", verifyEmailRouter);
appRouter.use("/menstrualCycle", menstrualCycleRouter);
appRouter.use("/", passwordRouter);
appRouter.use("/nutrition", nutritionRouter);

appRouter.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

module.exports = appRouter;
