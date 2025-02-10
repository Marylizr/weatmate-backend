const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct


exports.authMiddleware = async (req, res, next) => {
  // Safely check for token in Authorization header or cookies
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies ? req.cookies.token : null;

  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (tokenFromCookie) {
    token = tokenFromCookie;
  }

  if (!token) {
    console.log("Authorization token missing or malformed");
    return res.status(401).json({ message: "Authorization token missing or malformed" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Authenticated User: ${user.name} - Role: ${user.role}`);

    req.user = user;  // Attach user to the request
    req.sessionUser = user;  // For consistency
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