const express = require('express');

const { AddworkoutRouter } = require('../router/userRouter');





const appRouter = express.Router();

appRouter.use('/users', UserRouter);



module.exports = appRouter;