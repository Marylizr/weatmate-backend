const express = require("express");
const favController = require("../controllers/favController");
const favRouter = express.Router();

// Nueva ruta para agregar rondas
favRouter.patch("/add-round/:workoutName", favController.addRound);

// Rutas principales
favRouter.get("/", favController.findAll);
favRouter.get("/:id", favController.findOne);
favRouter.post("/", favController.create);
favRouter.put("/:id", favController.update);
favRouter.delete("/:id", favController.delete);

module.exports = favRouter;
