const express = require("express");
const userController = require("../controllers/usercontroller");
const userRouter = express.Router();
const {
  authMiddleware,
  IsAdmin,
  requireVerified,
} = require("../auth/authMiddleware");
const authenticateTrainer = require("../auth/authenticateTrainer");

// ==============================
//  AUTH ROUTES
// ==============================

// Logged-in user's data
userRouter.get("/me", authMiddleware, requireVerified, userController.findOne);

// Create new user by Admin
userRouter.post("/", authMiddleware, IsAdmin, userController.createUserByAdmin);

// Public sign up
userRouter.post("/create-profile", userController.create);

// Get all trainers (public)
userRouter.get("/trainers", userController.getAllTrainers);

// Send verification email
userRouter.post("/send-verification", userController.sendVerificationEmail);

// Confirm email
userRouter.get("/verify-email", userController.verifyEmail);

// Fetch all users (Admin + PT only)
userRouter.get(
  "/",
  authMiddleware,
  authenticateTrainer,
  userController.findAll
);

// ==============================
//  SPECIFIC QUERY ROUTES
//  (email, name, etc.)
// ==============================

userRouter.get(
  "/email/:id",
  authMiddleware,
  requireVerified,
  userController.findOneEmail
);

userRouter.get(
  "/name/:id",
  authMiddleware,
  requireVerified,
  userController.findOneName
);

userRouter.get(
  "/id/:email",
  authMiddleware,
  requireVerified,
  userController.findOneEmail
);

// ==============================
//  ADMIN UPDATE / DELETE ROUTES
// ==============================

// Admin updates any user
userRouter.put("/:id", authMiddleware, IsAdmin, userController.update);

// Admin deletes a user
userRouter.delete("/:id", authMiddleware, IsAdmin, userController.delete);

// ==============================
//  USER SELF-UPDATE ROUTE
// ==============================

// Logged-in user updates their own profile
userRouter.put("/", authMiddleware, requireVerified, userController.update);

// ==============================
//  SESSION NOTES ROUTES
// ==============================

userRouter.post(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  userController.addSessionNote
);

userRouter.get(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  userController.getSessionNotes
);

// ==============================
//  PREFERENCES ROUTES
// ==============================

userRouter.get(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  userController.getUserPreferences
);

userRouter.post(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  userController.addUserPreference
);

// ==============================
//  MEDICAL HISTORY ROUTES
// ==============================

userRouter.post(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  userController.addMedicalHistory
);

userRouter.get(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  userController.getMedicalHistory
);

// ==============================
//  NUTRITION HISTORY
// ==============================

userRouter.post("/:id/nutrition-history", userController.addNutritionHistory);

// ==============================
//  IMPORTANT — KEEP THIS LAST
//  Dynamic GET by ID
// ==============================

userRouter.get(
  "/:id",
  authMiddleware,
  requireVerified,
  userController.findOneId
);

module.exports = userRouter;
