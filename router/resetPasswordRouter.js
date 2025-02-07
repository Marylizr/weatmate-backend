const express = require("express");
const resetpasswordRouter = express.Router();
const passwordController = require("../controllers/passwordController");

resetpasswordRouter.post("/forgot-password", passwordController.forgotPassword);
resetpasswordRouter.get("/reset-password/:token", passwordController.verifyResetToken);
resetpasswordRouter.post("/reset-password/:token", passwordController.resetPassword);

module.exports = resetpasswordRouter;
