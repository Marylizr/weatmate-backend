require("dotenv").config();
const ChatUser = require("../models/chatUser");

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === Chat Completion Controller ===
exports.chatCompletion = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });

    const responseContent = response.choices[0].message.content;

    console.log("OpenAI Request completed");
    res.status(200).json({ success: true, response: responseContent });
  } catch (error) {
    console.error(
      "Error with OpenAI API:",
      error.response ? error.response.data : error.message
    );

    res.status(500).json({
      success: false,
      error: "An error occurred while processing the request.",
    });
  }
};

// === FIND ALL (GET) ===
exports.findAll = async (req, res) => {
  try {
    const { trainerId, infotype, subCategory } = req.query;
    const filter = {};

    if (trainerId) filter.trainerId = trainerId;
    if (infotype) filter.infotype = infotype;
    if (subCategory) filter.subCategory = subCategory;

    const chatEntries = await ChatUser.find(filter).sort({ date: -1 }).lean();

    if (!chatEntries.length) {
      return res.status(200).json({
        success: true,
        message: "No content found for the provided filters.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Content retrieved successfully.",
      count: chatEntries.length,
      data: chatEntries,
    });
  } catch (error) {
    console.error("Error fetching chat content:", error.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching chat content.",
      details: error.message,
    });
  }
};

// === CREATE (POST /savePrompt) ===
exports.create = async (req, res) => {
  try {
    const { name, trainerId, title, content, infotype, subCategory, picture } =
      req.body;

    console.log("Incoming request to /savePrompt:", req.body);

    if (!name || !trainerId || !content || !infotype || !title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields.",
      });
    }

    const validInfotypes = ["healthy-tips", "recipes", "workouts"];
    const validSubCategories = [
      "vegan",
      "vegetarian",
      "keto",
      "paleo",
      "gluten-free",
      "mediterranean",
      "low-carb",
      "basic",
      "medium",
      "advanced",
    ];

    if (!validInfotypes.includes(infotype)) {
      return res.status(400).json({
        success: false,
        error: "Invalid infotype value.",
      });
    }

    if (subCategory && !validSubCategories.includes(subCategory)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subCategory value.",
      });
    }

    const newChat = new ChatUser({
      name,
      trainerId,
      title,
      content,
      infotype,
      subCategory: subCategory || null,
      picture: picture || null,
      date: Date.now(),
    });

    await newChat.save();
    console.log("Saved to DB:", newChat);

    res.status(201).json({
      success: true,
      message: "Prompt saved successfully!",
      data: newChat,
    });
  } catch (error) {
    console.error("Error in /savePrompt:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

// === UPDATE ===
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, picture, infotype, subCategory, title } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID parameter is required." });
    }

    const validInfotypes = ["healthy-tips", "recipes", "workouts"];
    const validSubCategories = [
      "vegan",
      "vegetarian",
      "keto",
      "paleo",
      "gluten-free",
      "mediterranean",
      "low-carb",
      "basic",
      "medium",
      "advanced",
    ];

    if (infotype && !validInfotypes.includes(infotype)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid infotype value." });
    }

    if (subCategory && !validSubCategories.includes(subCategory)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid subCategory value." });
    }

    const updatedEntry = await ChatUser.findByIdAndUpdate(
      id,
      {
        ...(content && { content }),
        ...(title && { title }),
        ...(picture && { picture }),
        ...(infotype && { infotype }),
        ...(subCategory && { subCategory }),
        date: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found." });
    }

    res.status(200).json({
      success: true,
      message: "Content updated successfully.",
      data: updatedEntry,
    });
  } catch (error) {
    console.error("Error updating content:", error.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while updating the content.",
      details: error.message,
    });
  }
};

// === DELETE ===
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID parameter is required." });
    }

    const deletedEntry = await ChatUser.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found." });
    }

    res.status(200).json({
      success: true,
      message: "Content deleted successfully.",
      deleted: deletedEntry,
    });
  } catch (error) {
    console.error("Error deleting content:", error.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while deleting the content.",
      details: error.message,
    });
  }
};
