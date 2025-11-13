const express = require("express");
const chatController = require("../controllers/chatController.js");
const chatRouter = express.Router();

chatRouter.post("/chatCompletion", chatController.chatCompletion);

chatRouter.post("/savePrompt", chatController.create);

chatRouter.get("/savePrompt", chatController.findAll);

chatRouter.put("/savePrompt/:id", chatController.update);

chatRouter.delete("/savePrompt/:id", chatController.delete);

module.exports = chatRouter;
