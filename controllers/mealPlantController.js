const MealPlan = require('../models/mealPlanModel');

// Fetch all pre-designed workouts
exports.findAll = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find();
    res.status(200).json(mealPlans);
  } catch (error) {
    console.error("Error fetching workouts:", error.message);
    res.status(500).json({ error: "An error occurred while fetching mealPlans." });
  }
};

// Fetch a specific mealPlan by ID
exports.getMealPlans = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in query parameters" });
    }

    console.log("Received userId for filtering:", userId);

    // Filter meal plans by userName (if it represents userId)
    const mealPlans = await MealPlan.find({ userName: userId });

    console.log("Fetched meal plans for userId:", userId, mealPlans);

    res.status(200).json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error.message);
    res.status(500).json({ error: "An error occurred while fetching meal plans" });
  }
};



// Create a new mealPlan
exports.create = async (req, res) => {
  try {
    let payload = req.body;

    // Wrap single object payload in an array
    if (!Array.isArray(payload)) {
      console.log("Payload is not an array; wrapping it in an array.");
      payload = [payload];
    }

    // Validate payload
    payload.forEach((mealPlans, index) => {
      if (!mealPlans.name || !mealPlans.infotype || !mealPlans.content || !mealPlans.subCategory) {
        console.log(`MealPlan at index ${index} is missing required fields:`, mealPlans);
        throw new Error(`mealPlan at index ${index} is invalid.`);
      }
    });

    // Save melaPlan, skipping duplicates
    const newMealPlans = [];
    for (const mealPlans of payload) {
      const exists = await MealPlan.findOne({
        name: mealPlans.name,
        infotype: mealPlans.infotype,
        content: mealPlans.content,
        subCategory: mealPlans.subCategory,
      });

      if (exists) {
        console.log("Duplicate mealPlan found, skipping:", mealPlans);
        continue;
      }

      const newMealPlan = new MealPlan({
        name: mealPlans.name,
        infotype: mealPlans.infotype,
        content: mealPlans.content,
        date: mealPlans.date || new Date(),
        picture: mealPlans.picture,
        subCategory: mealPlans.subCategory,
      });

      const savedMealPlan = await newMealPlan.save();
      newMealPlans.push(savedMealPlan);
    }

    console.log("MealPlan created successfully:", newMealPlans);
    res.status(201).json({
      message: "MealPlan created successfully.",
      data: newMealPlans,
    });
  } catch (error) {
    console.error("Error in /MealPlan create:", error.message);
    res.status(500).json({ error: "An error occurred while creating MealPlan." });
  }
};



// Update a specific mealPlan by ID
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const updatedMealPlan = await MealPlan.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true } // Return the updated document and validate updates
    );

    if (!updatedMealPlan) {
      return res.status(404).json({ error: "MealPlan not found." });
    }

    res.status(200).json({
      message: "Your MealPlan has been updated successfully.",
      updatedMealPlan,
    });
  } catch (error) {
    console.error("Error updating mealPlan:", error.message);
    res.status(500).json({ error: "An error occurred while updating the mealPlan." });
  }
};

// Delete a specific mealPlan by ID
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await MealPlan.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "MealPlan not found." });
    }

    res.status(204).send(); // No content response
  } catch (error) {
    console.error("Error deleting MealPlan:", error.message);
    res.status(500).json({ error: "An error occurred while deleting the workout." });
  }
};
