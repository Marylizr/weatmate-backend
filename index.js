const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const appRouter = require('./router');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

mongoose
 .connect('mongodb://localhost:27017/rbac')
 .then(() => {
  console.log('Connected to the Database successfully');
 });
 
 app.use(bodyParser.json());

 const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});


app.use("/", appRouter);