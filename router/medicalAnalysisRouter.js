const express = require('express');
const medicalAnalysisRouter = express.Router();
const  analyzeMedicalHistoryController  = require('../controllers/analyzeMedicalHistoryController');


// POST /api/medical-analysis
medicalAnalysisRouter.post('/', analyzeMedicalHistoryController.analyzeMedicalHistory);

module.exports = medicalAnalysisRouter;


