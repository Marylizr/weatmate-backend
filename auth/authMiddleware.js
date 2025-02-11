const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct


exports.authMiddleware = async (req, res, next) => {
  // Extract token from cookies first, then headers
  const tokenFromCookie = req.cookies?.token;
  const authHeader = req.headers.authorization;

  let token = null;

  // Priority: Check cookies first (since we set cookies in the login)
  if (tokenFromCookie) {
    token = tokenFromCookie;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // If no token is found, deny access
  if (!token) {
    console.log("Authorization token missing or malformed");
    return res.status(401).json({ message: "Authorization token missing or malformed" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    // Find user based on the decoded token's ID
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Authenticated User: ${user.name} - Role: ${user.role}`);

    // Attach user to the request for downstream use
    req.user = user;
    req.sessionUser = user;  // For consistent naming if used elsewhere

    console.log("Middleware successfully attached user to request:", req.user);

    next();  // Proceed to the next middleware or route handler
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