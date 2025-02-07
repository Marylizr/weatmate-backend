const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); 

const authenticateTrainer = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the trainer by decoded id
    const trainer = await User.findById(decoded.id);

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Attach trainer info to the request for further use in the controller
    req.trainer = trainer;
    next(); // Continue to the next middleware/controller
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = authenticateTrainer;
