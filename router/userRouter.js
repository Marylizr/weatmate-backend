const express = require("express");
const userController = require("../controllers/usercontroller");
const userRouter = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const allowRoles = require("../auth/allowRoles");
const canAccessUserByRole = require("../auth/canAccessUserByRole");
const {
  authMiddleware,
  IsAdmin,
  requireVerified,
} = require("../auth/authMiddleware");

// ==============================
// AUTH / PROFILE ROUTES
// ==============================

// Logged-in user's data
userRouter.get("/me", authMiddleware, userController.findOne);

// Public sign up
// This should only create a basic/client user inside the controller
userRouter.post("/create-profile", userController.create);

// Dashboard create user
// Admin can create: basic, personal-trainer, admin
// Personal trainer can create: basic client only
userRouter.post(
  "/",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  userController.createUserByAdmin,
);

// Get all trainers
userRouter.get("/trainers", userController.getAllTrainers);

// Send verification email
userRouter.post("/send-verification", userController.sendVerificationEmail);

// Confirm email
userRouter.get("/verify-email", userController.verifyEmail);

// Fetch all users
userRouter.get(
  "/",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  userController.findAll,
);

// ==============================
// SELF UPDATE
// ==============================

userRouter.put("/", authMiddleware, requireVerified, userController.update);

userRouter.put("/me", authMiddleware, requireVerified, userController.update);

// ==============================
// FEMALE PROFILE ROUTES
// IMPORTANT: before /:id
// ==============================

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

userRouter.get(
  "/cycle/me",
  authMiddleware,
  requireVerified,
  userController.getMyCycle,
);

userRouter.get(
  "/:id/cycle",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getUserCycle,
);

userRouter.patch(
  "/:id/femaleProfile",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.updateClientFemaleProfile,
);

// ==============================
// CLIENT SNAPSHOT
// ==============================

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
// IMPORTANT: before /:id
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
// SESSION NOTES ROUTES
// ==============================

userRouter.post(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.addSessionNote,
);

userRouter.get(
  "/:id/session-notes",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getSessionNotes,
);

// ==============================
// PREFERENCES ROUTES
// ==============================

userRouter.get(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getUserPreferences,
);

userRouter.post(
  "/:id/user-preferences",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.addUserPreference,
);

// ==============================
// MEDICAL HISTORY ROUTES
// ==============================

userRouter.post(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  upload.single("file"),
  userController.addMedicalHistory,
);

userRouter.get(
  "/:id/medical-history",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.getMedicalHistory,
);

// ==============================
// INJURY PROFILE ROUTES
// ==============================

userRouter.patch(
  "/:id/injury-profile",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.updateInjuryProfile,
);

// ==============================
// ACCESSIBILITY PROFILE ROUTES
// ==============================

userRouter.patch(
  "/:id/accessibility-profile",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.updateAccessibilityProfile,
);
// ==============================
// NUTRITION HISTORY
// ==============================

userRouter.post(
  "/:id/nutrition-history",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.addNutritionHistory,
);

// ==============================
// ADMIN/TRAINER UPDATE / DELETE
// IMPORTANT: dynamic routes near the bottom
// ==============================

// Admin OR Trainer can update user by id
// canAccessUserByRole must ensure trainer only accesses assigned clients
userRouter.put(
  "/:id",
  authMiddleware,
  requireVerified,
  allowRoles("admin", "personal-trainer"),
  canAccessUserByRole,
  userController.update,
);

// Admin deletes a user
userRouter.delete(
  "/:id",
  authMiddleware,
  requireVerified,
  IsAdmin,
  userController.delete,
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
