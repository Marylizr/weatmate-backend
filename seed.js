const mongoose = require('mongoose');
const User = require('./models/userModel');  // Adjust path to your user model

mongoose.connect('mongodb://localhost:27017/yourdbname', { useNewUrlParser: true, useUnifiedTopology: true });

const seedUsers = async () => {
  await User.deleteMany({});
  await User.create({
    email: 'admin@gmail.com',
    password: 'hashedpassword',  // Make sure this matches the hashed version if you're using bcrypt
    role: 'admin',
    gender: 'female',
  });
  console.log('Database seeded!');
  mongoose.disconnect();
};

seedUsers();
