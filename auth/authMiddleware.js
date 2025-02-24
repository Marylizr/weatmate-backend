const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct



exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Authorization token missing or malformed");
    return res.status(401).json({ message: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Authorization Header Received:", authHeader);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User Found:", user.name, "ID:", user._id);

    req.user = user; // Attach user info

    console.log("Middleware successfully attached user to request:", req.user);
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};



exports.IsAdmin = (req, res, next) => {
  console.log("Checking Admin Role for User:", req.user ? req.user.role : "No user found");

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. No user information found.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  console.log("User is an Admin. Proceeding...");
  next();
};

exports.requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(500).json({ message: "User data not available. Ensure authentication middleware is working correctly." });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ message: "Please verify your email to access this resource." });
  }

  next();
};
