<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectToDatabase = require('./mongo/index');
const userRouter = require('./router'); // assuming this mounts /user, etc.

const app = express();
const port = process.env.PORT || 3001;

// Force HTTPS in prod
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
=======
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./mongo/index"); // Import the MongoDB connection
const app = express();
const port = process.env.PORT || 3001;

if (!port) {
  console.error("PORT environment variable is not defined.");
  process.exit(1); // Exit if PORT isn't set
}
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.headers.host + req.url);
>>>>>>> main
    }
    next();
  });
}

// Connect to MongoDB
connectToDatabase();

<<<<<<< HEAD
// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
=======
// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
>>>>>>> main

// CORS setup
const allowedOrigins = [
  process.env.BASE_URL,            // e.g. https://sweatmateapp.netlify.app
  'http://localhost:3000',         // React dev server
];

<<<<<<< HEAD
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve uploaded PDFs (so your pdfUrl links work)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/', userRouter);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'SweatMate Backend is Running!' });
=======
const corsOptions = {
  origin: process.env.BASE_URL || "https://sweatmateapp.netlify.app",
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors()); // Handle preflight requests

// Routes
const appRouter = require("./router");
app.use("/", appRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "SweatMate Backend is Running!" });
>>>>>>> main
});

app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
