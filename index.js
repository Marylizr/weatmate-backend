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


const allowedOrigins = [
    "https://sweatmateapp.netlify.app",  // Production Frontend
    "http://localhost:3000"  // Local Development Frontend
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error("Blocked CORS request from:", origin);
            callback(new Error("CORS not allowed for this origin."));
        }
    },
    credentials: true,  // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions));

// Handle preflight (OPTIONS) requests properly
app.options("*", cors()); 






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
