const express = require('express');
const  MoodTrackerController  = require('../controllers/moodTrackerController')
const MoodTrackerRouter = express.Router();



MoodTrackerRouter.get('/', MoodTrackerController.findAll);

MoodTrackerRouter.get('/:id', MoodTrackerController.findOne);

MoodTrackerRouter.post('/',  MoodTrackerController.create)

MoodTrackerRouter.delete('/:id', MoodTrackerController.delete);

MoodTrackerRouter.put('/', MoodTrackerController.update);


module.exports =  MoodTrackerRouter ; 