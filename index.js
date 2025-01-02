const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRouter = require('./router');
require('dotenv').config();
const connectToDatabase = require('./mongo/index'); // Import the setup function
const app = express();
const port = process.env.PORT || 3001;

connectToDatabase(); // Call the function to connect to MongoDB


// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Enable CORS for all origins
app.use(cors({
  origin: '*', // Adjust as needed for security in production
  optionsSuccessStatus: 200
}));



// Set Mongoose strict mode (optional)
mongoose.set('strictQuery', true);



// Define routes
app.use("/", appRouter);
app.use((req, res, next) => {
  console.log('Raw Request Body:', req.body);
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`SweatMate listening at http://localhost:${port}`);
});
