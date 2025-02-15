const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectToDatabase = require('./mongo/index');  // Adjust path as needed
const User = require('./models/userModel');  // Adjust path as needed

// Seed function
const seedUsers = async () => {
    try {
        await connectToDatabase(); 

        await User.deleteMany({});  

        const hashedPassword = await bcrypt.hash('lamismaclave1234', 10);

        await User.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin',
            gender: 'female',
            goal: 'Stay fit',     
            weight: 65,           
            height: 170,          
            age: 30               
        });

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding the database:', error);
    } finally {
        await mongoose.disconnect();  // Clean disconnection
    }
};

seedUsers();
