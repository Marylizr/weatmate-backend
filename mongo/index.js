const mongoose = require("mongoose");

const connectToDatabase = async () => {
    try {
        const databaseURL = process.env.DATABASE_URL;
        if (!databaseURL) {
            throw new Error("DATABASE_URL is not defined in the environment variables.");
        }

        mongoose.set("strictQuery", true);

        await mongoose.connect(databaseURL);

        const mongo = mongoose.connection;

        mongo.on("error", (error) => console.error("MongoDB connection error:", error));
        mongo.once("open", () => {
            console.log("Connected to SweatMate database");
        });

        console.log("MongoDB Connection Verified and connected to SweatMate DDBB");

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = connectToDatabase;
