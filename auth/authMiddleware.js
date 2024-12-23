const jwt = require("jsonwebtoken");
const User = require('../models/userModel');


exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const accessToken = authHeader.split(" ")[1];
  console.log("Access Token:", accessToken); // Check the extracted token

  let tokenData;
  try {
    tokenData = jwt.verify(accessToken, process.env.JWT_SECRET);
    console.log("Decoded Token Data:", tokenData); // Check the decoded token data
  } catch (e) {
    return res.status(400).json({ message: "Invalid token", error: e.message });
  }

  try {
    const user = await User.findById(tokenData.id);
    console.log("User Found by Token:", user); // Check the user retrieved by token ID

    if (user) {
      req.user = user;
      req.sessionUser = user;
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving user", error: error.message });
  }

  next();
};




exports.IsAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. No user information found.' });
    }
  
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  
    next();
  };
  
    