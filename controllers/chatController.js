const { Configuration, OpenAIApi } = require('openai');
const ChatUser = require('../models/chatUser');
const OpenAI = require('openai');

// Initialize OpenAI Configuration
const configuration = new Configuration({
  organization: 'org-Vk2U2DI5BA7Hpq6iiTHFUblK',
  apiKey: ''
});


// Create an OpenAI API Client
const openai = new OpenAIApi(configuration);

// Chat Completion Controller
exports.chatCompletion = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate the input
    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // Use the correct model name
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
    });

    // Extract and send the response content
    const responseContent = response.data.choices[0].message.content;
    res.status(200).send({ response: responseContent });

    console.log('OpenAI Request ID:', response.data.id); // Log request ID for debugging
  } catch (error) {
    console.error('Error with OpenAI API:', error.response ? error.response.data : error.message);
    res.status(500).send({ error: 'An error occurred while processing the request' });
  }
};


// Controller to Retrieve All Chat Users
exports.findAll = async (req, res) => {
  try {
    const users = await ChatUser.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching chat users:', error.message);
    res.status(500).send({ error: 'An error occurred while fetching chat users' });
  }
};

// Controller to Create a New Chat User Entry
exports.create = async (req, res) => {
  try {
    const { userName, content, infotype, picture } = req.body;

    // Prepare Data for Insertion
    const dataPosted = {
      userName,
      content,
      infotype,
      picture,
      date: Date.now(),
    };

    // Save New Chat Entry to Database
    const newChat = new ChatUser(dataPosted);
    await newChat.save();

    console.log('New Chat Created:', newChat);
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat entry:', error.message);
    res.status(500).send({ error: 'An error occurred while creating a new chat entry' });
  }
};
