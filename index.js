require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./mongo/index');  // Import the MongoDB connection
const app = express();

// Set the port dynamically based on environment
const port = process.env.PORT || 3001;

if (!port) {
    console.error("PORT environment variable is not defined.");
    process.exit(1); // Exit if PORT isn't set
}

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const cors = require("cors");

// CORS Configuration for local and production environments
const allowedOrigins = [
    "https://sweatmateapp.netlify.app",
    "http://localhost:3000"  // Development mode
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed for this origin."));
        }
    },
    credentials: true,  // Allow cookies and authorization headers
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  // Allow all necessary HTTP methods
};

app.use(cors(corsOptions));

// Handle preflight requests properly
app.options("*", cors(corsOptions)); 



// Routes
const appRouter = require('./router');
app.use('/', appRouter);

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'SweatMate Backend is Running!' });
});

// Start Server
app.listen(port, () => {
    console.log(`SweatMate listening on port ${port}`);
});
