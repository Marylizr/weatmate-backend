const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatUserSchema = new Schema({
  // Contenido principal generado por ChatGPT
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  // Imagen opcional
  picture: {
    type: String,
    default: null,
  },

  // Nombre del entrenador que lo creó (por conveniencia visual)
  name: {
    type: String,
    required: true,
  },

  // ID real del entrenador (referencia al modelo User)
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Tipo principal de contenido
  infotype: {
    type: String,
    enum: ["healthy-tips", "recipes", "workouts"],
    required: true,
  },

  // Subcategoría dinámica (puede ser tipo de receta o nivel de entrenamiento)
  subCategory: {
    type: String,
    enum: [
      "vegan",
      "vegetarian",
      "keto",
      "paleo",
      "gluten-free",
      "mediterranean",
      "low-carb",
      "basic",
      "medium",
      "advanced",
    ],
    default: null,
  },

  // Fecha de creación
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatUser", ChatUserSchema);
