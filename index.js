require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRouter = require('./router');
const connectToDatabase = require('./mongo/index'); // MongoDB connection function

const app = express();
const port = process.env.PORT || 3001; // Ensure it uses Heroku's dynamic port

connectToDatabase(); // Connect to MongoDB

// Middleware for JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration (Adjust the origin to allow Netlify URL)
const corsOptions = {
  origin: ['http://localhost:3000', 'https://sweatmateapp.netlify.app'], // Allow both local and deployed frontends
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors()); // Handle preflight requests

// Routes
app.use("/", appRouter);

// Ensure server binds to the correct port
app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
