const express = require("express");
const progressController = require("../controllers/progressController");

const progressRouter = express.Router();

// GET all
progressRouter.get("/", progressController.findAll);

// GET one
progressRouter.get("/:id", progressController.findOne);

// CREATE
progressRouter.post("/", progressController.create);

// UPDATE
progressRouter.patch("/:id", progressController.update);
progressRouter.put("/:id", progressController.update);

// DELETE
progressRouter.delete("/:id", progressController.delete);

module.exports = progressRouter;
