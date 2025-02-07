require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRouter = require('./router');
const connectToDatabase = require('./mongo/index');

const app = express();

// This ensures Heroku provides the port. Remove any hardcoded defaults.
const port = process.env.PORT;

// Connect to MongoDB
connectToDatabase();

// Middleware to parse JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Setup
const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "https://sweatmateapp.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors());

// Route Definitions
app.use("/", appRouter);

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SweatMate Backend is Running!' });
});

// Start the server using process.env.PORT
app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
