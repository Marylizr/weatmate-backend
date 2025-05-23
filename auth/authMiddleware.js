const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct

exports.authMiddleware = async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Authorization token missing or malformed");
    return res.status(401).json({ message: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Authorization Header Received:", authHeader);

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

// exports.authMiddleware = (req, res, next) => {
//   if (process.env.NODE_ENV === 'development') {
//     req.user = { id: 'local-id', role: 'admin', gender: 'female' }; // Fake user data
//     return next();
//   }

//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: 'Authorization token missing or malformed' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };





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
