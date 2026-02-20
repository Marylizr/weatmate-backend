const express = require("express");
const designedByPtController = require("../controllers/designedByPtController");
const designedByPtRouter = express.Router();



designedByPtRouter.get("/", designedByPtController.getAssignments);
designedByPtRouter.post("/", designedByPtController.upsertDay);
designedByPtRouter.delete("/:id", designedByPtController.deleteDay);

module.exports = designedByPtRouter;
