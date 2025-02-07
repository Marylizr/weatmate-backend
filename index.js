require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRouter = require('./router');
const connectToDatabase = require('./mongo/index'); // Import the setup function
const app = express();
const port = process.env.PORT || 3001;


connectToDatabase(); // Call the function to connect to MongoDB


// Middleware to parse JSON
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "https://sweatmateapp.netlify.app" // Add your Netlify frontend URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
};

app.use(cors(corsOptions));
app.options("*", cors()); // Handle preflight requests

app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});


// Set Mongoose strict mode (optional)
mongoose.set('strictQuery', true);

// Define routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SweatMate Backend is Running!' });
});

app.use("/", appRouter);


// Middleware to log raw request body
app.use((req, res, next) => {
  console.log('Raw Request Body:', req.body);
  next();
});

