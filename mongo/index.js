const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    const databaseURL = process.env.DATABASE_URL;
    if (!databaseURL) {
      throw new Error('DATABASE_URL is not defined in the environment variables.');
    }

    await mongoose.connect(databaseURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const mongo = mongoose.connection;

    mongo.on('error', (error) => console.error('MongoDB connection error:', error));
    mongo.once('open', () => {
      console.log('Connected to SweatMate database');
    });

    mongoose.set('strictQuery', true);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1); // Exit the application if the connection fails
  }
};

module.exports = connectToDatabase;



