const express = require("express");
const preWorkoutController = require("../controllers/preWorkoutController");
const router = express.Router();

router.get("/", preWorkoutController.findAll);
router.get("/:id", preWorkoutController.findOne);
router.post("/", preWorkoutController.create);
router.put("/:id", preWorkoutController.update);
router.delete("/:id", preWorkoutController.delete);

module.exports = router;
