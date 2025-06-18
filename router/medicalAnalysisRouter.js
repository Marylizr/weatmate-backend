const express = require('express');
const medicalAnalysisRouter = express.Router();
const  medicalAnalysisController  = require('../controllers/medicalAnalysisController');


// POST /api/medical-analysis
medicalAnalysisRouter.post('/', medicalAnalysisController);

module.exports = medicalAnalysisRouter;


