const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authenticateTrainer = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id role trainerId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admin bypass
    if (user.role === "admin") {
      req.user = user;
      return next();
    }

    // Trainer allowed
    if (user.role === "trainer") {
      req.user = user;
      req.trainer = user;
      return next();
    }

    // Anyone else blocked
    return res.status(403).json({
      message: "Access denied. Trainers or Admins only.",
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticateTrainer;
