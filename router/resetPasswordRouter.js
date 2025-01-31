const express = require("express");
const passwordRouter = express.Router();
const passwordController = require("../controllers/passwordController");

passwordRouter.post("/forgot-password", passwordController.forgotPassword);
passwordRouter.get("/reset-password/:token", passwordController.verifyResetToken);
passwordRouter.post("/reset-password/:token", passwordController.resetPassword);

module.exports = passwordRouter;
