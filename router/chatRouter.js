const express = require ("express");
const  chatController = require( "../controllers/chatController.js");
const chatRouter = express.Router();
const { authMiddleware } = require('../auth/authMiddleware');

chatRouter.post('/chatCompletion', chatController.chatCompletion);

chatRouter.post('/savePrompt', chatController.create);

chatRouter.get('/savePrompt',  chatController.findAll);

module.exports =  chatRouter;