const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path')
const User = require('./models/userModel')
const cors = require('cors');
const appRouter = require('./router');
require("dotenv").config();
const databaseURL = process.env.DATABASE_URL;

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

mongoose.connect(databaseURL)
.then(() => {
    console.log('connected to beFit database');
});


 app.use(bodyParser.json());

app.use(async (req, res, next) => {
 if (req.headers["x-access-token"]) {
  const accessToken = req.headers["x-access-token"];
  const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
  // Check if token has expired
  if (exp < Date.now().valueOf() / 1000) { 
   return res.status(401).json({ error: "JWT token has expired, please login to obtain a new one" });
  } 
  res.locals.loggedInUser = await User.findById(userId); next(); 
 } else { 
  next(); 
 } 
});

app.use('/', appRouter); app.listen(PORT, () => {
  console.log('BeFit server is listening on Port:', PORT)
})