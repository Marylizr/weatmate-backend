const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const appRouter = require('./router');
require('dotenv').config();
const mongoConnection = require('./mongo/index')

const app = express();
const port = process.env.PORT;

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

 
 app.use(bodyParser.json());

 const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});


app.use("/", appRouter);