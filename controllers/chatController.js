const { Configuration, OpenAIApi } = require('openai');
const ChatUser = require('../models/chatUser');
const OpenAI = require('openai');

// Initialize OpenAI Configuration
const configuration = new Configuration({
  organization: 'org-Vk2U2DI5BA7Hpq6iiTHFUblK',
  apiKey: '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'
});


// Create an OpenAI API Client
const openai = new OpenAIApi(configuration);

// Chat Completion Controller
exports.chatCompletion = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate the input
    if (!prompt) {
      return res.status(400).send({ error: "Prompt is required" });
    }

    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: "gpt-4", // Correct model name
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      
    });

    // Extract and send the response content
    const responseContent = response.data.choices[0].message.content;
    res.status(200).send({ response: responseContent });

    console.log("OpenAI Request ID:", response.data.id); // Log request ID for debugging
  } catch (error) {
    console.error("Error with OpenAI API:", error.response ? error.response.data : error.message);
    res.status(500).send({ error: "An error occurred while processing the request" });
  }
};

// Controller to Retrieve All Chat Users
exports.findAll = async (req, res) => {
  try {
    const users = await ChatUser.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching chat users:", error.message);
    res.status(500).send({ error: "An error occurred while fetching chat users" });
  }
};

// Controller to Create a New Chat User Entry
exports.create = async (req, res) => {
  try {
    const { userName, content, infotype, subCategory, picture } = req.body;

    // Validate Required Fields
    if (!userName || !content || !infotype) {
      return res
        .status(400)
        .send({ error: "userName, content, and infotype are required." });
    }

    // Validate Enum Values for infotype and subCategory
    const validInfotypes = ["healthy-tips", "recipes", "workouts"];
    const validRecipeCategories = [
      "vegan",
      "vegetarian",
      "keto",
      "paleo",
      "gluten-free",
      "mediterranean",
      "low-carb",
    ];
    const validWorkoutLevels = ["basic", "medium", "advanced"];

    if (!validInfotypes.includes(infotype)) {
      return res.status(400).send({ error: "Invalid infotype value." });
    }

    if (
      infotype === "recipes" &&
      subCategory &&
      !validRecipeCategories.includes(subCategory)
    ) {
      return res.status(400).send({ error: "Invalid recipe subCategory value." });
    }

    if (
      infotype === "workouts" &&
      subCategory &&
      !validWorkoutLevels.includes(subCategory)
    ) {
      return res.status(400).send({ error: "Invalid workout subCategory value." });
    }

    // Prepare Data for Insertion
    const dataPosted = {
      userName,
      content,
      infotype,
      subCategory: subCategory || null, // Ensure subCategory is optional
      picture: picture || null, // Handle optional picture
      date: Date.now(),
    };

    // Save New Chat Entry to Database
    const newChat = new ChatUser(dataPosted);
    await newChat.save();

    console.log("New Chat Created:", newChat);
    res.status(201).json(newChat);
  } catch (error) {
    console.error("Error creating chat entry:", error.message);
    res.status(500).send({ error: "An error occurred while creating a new chat entry" });
  }
};


// Update a specific prompt by ID
exports.update = async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from the request parameters
    const data = req.body; // Extract updated data from the request body

    const updatedPrompt = await ChatUser.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true } // Return the updated document and validate inputs
    );

    if (!updatedPrompt) {
      return res.status(404).json({ error: "Prompt not found." });
    }

    res.status(200).json({
      message: "Your prompt has been updated successfully.",
      updatedPrompt, // Return the updated prompt
    });
  } catch (error) {
    console.error("Error updating prompt:", error.message);
    res.status(500).json({ error: "An error occurred while updating the prompt." });
  }
};


// Delete a specific workout by ID
exports.delete = async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from the request parameters

    const result = await ChatUser.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Prompt not found." });
    }

    res.status(200).json({
      message: "The prompt has been deleted successfully.",
      deletedPrompt: result, // Optionally return the deleted document for confirmation
    });
  } catch (error) {
    console.error("Error deleting the prompt:", error.message);
    res.status(500).json({ error: "An error occurred while deleting the prompt." });
  }
};
