const express = require('express');
const appRouter = require('./router');
require('dotenv').config();
const app = express();
const bodyParser = require('body-parser')
const mongo = require('./mongo');
const cors = require('cors');

const port = process.env.PORT;

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());


const server = app.listen(port, () => {
  console.log(`beFit App listening at http://localhost:${port}`)
});

app.use('/', appRouter);
