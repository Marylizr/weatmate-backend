const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct

exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token Data:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User Found: ${user.name} (${user.email})`);
    req.user = user;
    req.sessionUser = user; // Attach for findOneId
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
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
  

  exports.requireVerified = (req, res, next) => {
    // Ensure req.user exists
    if (!req.user) {
      return res.status(500).json({ message: "User data not available. Ensure authentication middleware is working correctly." });
    }
  
    // Allow admins to bypass email verification
    if (req.user.role === "admin") {
      return next();
    }
  
    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({ message: "Please verify your email to access this resource." });
    }
  
    next();
  };

