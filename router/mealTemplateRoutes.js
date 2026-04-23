const express = require("express");
const {
  createTemplate,
  getTemplates,
  deleteTemplate,
} = require("../controllers/mealTemplateController");

const { authMiddleware } = require("../auth/authMiddleware");

const mealTemplateRouter = express.Router();

mealTemplateRouter.post("/", authMiddleware, createTemplate);
mealTemplateRouter.get("/", authMiddleware, getTemplates);
mealTemplateRouter.delete("/:id", authMiddleware, deleteTemplate);

module.exports = mealTemplateRouter;
