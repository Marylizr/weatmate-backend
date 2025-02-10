require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./mongo/index');  // Import the MongoDB connection
const app = express();
const port = process.env.PORT;
const cookieParser = require('cookie-parser');

if (!port) {
    console.error("PORT environment variable is not defined.");
    process.exit(1); // Exit if PORT isn't set
}
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
          return res.redirect('https://' + req.headers.host + req.url);
      }
      next();
  });
}

// Middleware to parse cookies
app.use(cookieParser());

// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration
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
app.options("*", cors());  // Handle preflight requests

// Routes
const appRouter = require('./router');

app.get('/', (req, res) => {
    res.status(200).json({ message: 'SweatMate Backend is Running!' });
});
app.use("/", appRouter);

// Default Route to Confirm Server is Running

// Start Server
app.listen(port, () => {
    console.log(`SweatMate listening on port ${port}`);
});
