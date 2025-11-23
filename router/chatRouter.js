const express = require("express");
const chatController = require("../controllers/chatController.js");

const chatRouter = express.Router();

// Generate ChatGPT response
chatRouter.post("/chatCompletion", chatController.chatCompletion);

// Create content
chatRouter.post("/savePrompt", chatController.create);

// Get all content
chatRouter.get("/savePrompt", chatController.findAll);

// Update content
chatRouter.put("/savePrompt/:id", chatController.update);

// Delete content
chatRouter.delete("/savePrompt/:id", chatController.delete);

module.exports = chatRouter;
