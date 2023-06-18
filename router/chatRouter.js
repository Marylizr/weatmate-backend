const express = require ("express");
const  chatController = require( "../controllers/chatController.js");
const chatRouter = express.Router();

chatRouter.post('/chat', chatController.chatCompletion);

module.exports = { chatRouter};