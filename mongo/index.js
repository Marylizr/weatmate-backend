const mongoose = require("mongoose");
require('dotenv').config();

const connectToDatabase = async () => {
    try {
        const databaseURL = process.env.DATABASE_URL;
        
        if (!databaseURL) {
            throw new Error("DATABASE_URL is not defined in the environment variables.");
        }

        mongoose.set("strictQuery", true);

        await mongoose.connect(databaseURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const db = mongoose.connection;

        db.on("error", (error) => console.error("MongoDB connection error:", error));
        db.once("open", () => {
            console.log("MongoDB Connection Verified and connected to SweatMate DDBB");
        });

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);  // Exit the process if connection fails
    }
};

module.exports = connectToDatabase;
