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

const allowedOrigins = [
  "http://localhost:3000",
  "https://sweatmateapp.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sin origen (por ejemplo, Postman o server-side)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Aplica CORS global
app.use(cors(corsOptions));

// Respuesta correcta a preflight OPTIONS
app.options("*", cors(corsOptions));

/* -------------------------- */

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
