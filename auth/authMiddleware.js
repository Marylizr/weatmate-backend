const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure the User model path is correct

exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. VALIDACIÓN HEADER
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header missing or malformed");
      return res.status(401).json({
        message: "Authorization token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("Token missing after Bearer");
      return res.status(401).json({ message: "Token missing" });
    }

    // 2. VERIFY TOKEN
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("Token verification failed:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // 3. VALIDATE TOKEN PAYLOAD
    if (!decoded || !decoded.id) {
      console.log("Token payload invalid:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 4. FIND USER IN DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("User not found for token id:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    // 5. NORMALIZE USER OBJECT (CRITICAL FIX)
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // 🔥 CLAVE → siempre disponible
      _id: user._id.toString(), // 🔥 consistencia total
    };

    req.sessionUser = req.user;

    // 6. DEBUG LOGS (MUY IMPORTANTE PARA TU BUG)
    console.log("----- AUTH DEBUG -----");
    console.log("TOKEN USER ID:", decoded.id);
    console.log("DB USER ID:", user._id.toString());
    console.log("USER NAME:", user.name);
    console.log("USER ROLE:", user.role);
    console.log("----------------------");

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({
      message: "Authentication error",
      error: error.message,
    });
  }
};

// --------------------------------------
// ADMIN CHECK
// --------------------------------------
exports.IsAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized. No user information found.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }

  next();
};

// --------------------------------------
// VERIFIED CHECK
// --------------------------------------
exports.requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(500).json({
      message: "User data not available. Check authMiddleware.",
    });
  }

  // Admin bypass
  if (req.user.role === "admin") {
    return next();
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email to access this resource.",
    });
  }

  next();
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
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized. No user information found.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }

  next();
};

exports.requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not authenticated",
    });
  }

  //  ADMIN BYPASS
  if (req.user.role === "admin") {
    return next();
  }

  //  NO BLOQUEA /me SI QUIERES (recomendado)
  if (!req.user.isVerified) {
    console.warn("User not verified:", req.user.email);

    // OPCIÓN SEGURA: NO BLOQUEAR, SOLO AVISAR
    req.user.notVerified = true;
    return next();

    //  si quieres bloquear:
    // return res.status(403).json({ message: "Please verify your email" });
  }

  next();
};
