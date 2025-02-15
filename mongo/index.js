const mongoose = require('mongoose');
require('dotenv').config();



const connectToDatabase = async () => {
    const dbURI = process.env.NODE_ENV === 'development' 
    ? 'mongodb://localhost:27017/test' 
    : process.env.MONGO_ATLAS_URI;

    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('DB connected'))
    .catch((err) => console.error('DB connection error:', err));

    //try {
        // const databaseURL = process.env.DATABASE_URL;
        
        // if (!databaseURL) {
        //     throw new Error("DATABASE_URL is not defined in the environment variables.");
        // }

        // mongoose.set("strictQuery", true);

       
        // await mongoose.connect(databaseURL);

        // const db = mongoose.connection;

        // db.on("error", (error) => console.error("MongoDB connection error:", error));
        // db.once("open", () => {
        //     console.log("MongoDB Connection Verified and connected to SweatMate DDBB");
        // });

   // } catch (error) {
     //   console.error("Failed to connect to MongoDB:", error.message);
       // process.exit(1); 
   // }
};

module.exports = connectToDatabase;
