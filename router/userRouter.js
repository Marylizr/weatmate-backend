const express = require("express");
const userController = require("../controllers/usercontroller");
const userRouter = express.Router();

const allowRoles = require("../auth/allowRoles");
const canAccessUserByRole = require("../auth/canAccessUserByRole");
const {
  authMiddleware,
  IsAdmin,
  requireVerified,
} = require("../auth/authMiddleware");
const authenticateTrainer = require("../auth/authenticateTrainer");

// ==============================
// AUTH / PROFILE ROUTES
// ==============================

// Logged-in user's data
userRouter.get("/me", authMiddleware, userController.findOne);

// Public sign up
userRouter.post("/create-profile", userController.create);

// Create new user by Admin
userRouter.post("/", authMiddleware, IsAdmin, userController.createUserByAdmin);

// Get all trainers (public)
userRouter.get("/trainers", userController.getAllTrainers);

// Send verification email (if you call it like: POST /user/send-verification { userId } or similar)
// If your frontend calls it differently, keep the function but adjust route later.
userRouter.post("/send-verification", userController.sendVerificationEmail);

// Confirm email
userRouter.get("/verify-email", userController.verifyEmail);

// Fetch all users (Admin + PT only)
userRouter.get(
  "/",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  authenticateTrainer,
  userController.findAll,
);

// ==============================
// SELF UPDATE (legacy + nice-to-have)
// ==============================

userRouter.put("/", authMiddleware, requireVerified, userController.update); // update self (legacy)
userRouter.put("/me", authMiddleware, requireVerified, userController.update); // update self (nice)
userRouter.put("/user/:id", authMiddleware, userController.update);

// ==============================
// FEMALE PROFILE ROUTES (IMPORTANT: before /:id)
// ==============================

// Self updates femaleProfile
userRouter.put(
  "/cycle",
  authMiddleware,
  requireVerified,
  userController.updateMyCycle,
);

userRouter.post(
  "/cycle/log",
  authMiddleware,
  requireVerified,
  userController.addMyCycleLog,
);

userRouter.get("/cycle/me", authMiddleware, userController.getMyCycle);

userRouter.get(
  "/:id/cycle",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getUserCycle,
);

// Trainer/Admin updates client's femaleProfile
userRouter.patch(
  "/:id/femaleProfile",
  authMiddleware,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.updateClientFemaleProfile,
);

// Client snapshot for Training dashboard (trainer/admin)
userRouter.get(
  "/clientSnapshot/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getClientSnapshot,
);

// ==============================
// SPECIFIC QUERY ROUTES
// ==============================

userRouter.get(
  "/email/:id",
  authMiddleware,
  requireVerified,
  userController.findOneEmail,
);

userRouter.get(
  "/name/:id",
  authMiddleware,
  requireVerified,
  userController.findOneName,
);

// ==============================
// ADMIN/TRAINER UPDATE / DELETE
// ==============================

// Admin OR Trainer (only assigned clients) can update user by id
userRouter.put(
  "/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.update,
);

// Admin deletes a user
userRouter.delete("/:id", authMiddleware, IsAdmin, userController.delete);

// ==============================
// SESSION NOTES ROUTES
// ==============================

userRouter.post(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  userController.addSessionNote,
);

userRouter.get(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  userController.getSessionNotes,
);

// ==============================
// PREFERENCES ROUTES
// ==============================

userRouter.get(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  userController.getUserPreferences,
);

userRouter.post(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  userController.addUserPreference,
);

// ==============================
// MEDICAL HISTORY ROUTES
// ==============================

userRouter.post(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  userController.addMedicalHistory,
);

userRouter.get(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  userController.getMedicalHistory,
);

// ==============================
// NUTRITION HISTORY
// ==============================

userRouter.post(
  "/:id/nutrition-history",
  authMiddleware,
  requireVerified,
  userController.addNutritionHistory,
);

// ==============================
// IMPORTANT — KEEP THIS LAST
// Dynamic GET by ID
// ==============================

userRouter.get(
  "/:id",
  authMiddleware,
  requireVerified,
  userController.findOneId,
);

module.exports = userRouter;
