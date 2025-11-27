require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./mongo/index");
const app = express();
const port = process.env.PORT || 3001;

if (!port) {
  console.error("PORT environment variable is not defined.");
  process.exit(1);
}

// Force HTTPS in production
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

// Body Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ====== CORS CONFIG (FIXED) ======
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://sweatmateapp.netlify.app",
      "https://sweatmate-app-b74e82edf23b.herokuapp.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    credentials: true,
  })
);

// Preflight OPTIONS
app.options("*", cors());

// =================================

// ROUTES
const appRouter = require("./router");
app.use("/", appRouter);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({ message: "SweatMate Backend is Running!" });
});

// Start server
app.listen(port, () => {
  console.log(`SweatMate listening on port ${port}`);
});
