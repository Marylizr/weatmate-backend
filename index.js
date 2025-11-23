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
    }
    next();
  });
}

// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://sweatmateapp.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Routes
const appRouter = require("./router");
app.use("/", appRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "SweatMate Backend is Running!" });
});

// Default Route to Confirm Server is Running

// Start Server
app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
