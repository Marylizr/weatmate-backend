require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRouter = require('./router');
const connectToDatabase = require('./mongo/index');
const app = express();

// Use the PORT provided by Heroku
const port = process.env.PORT || 3001;

connectToDatabase();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const corsOptions = {
  origin: ["http://localhost:3000", "https://sweatmateapp.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors());

// Define Root Route before other routers
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SweatMate Backend is Running!' });
});

// Use Routers
app.use("/", appRouter);

// Catch-all route for undefined paths
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Ensure the app listens on the correct port
app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
