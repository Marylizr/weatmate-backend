const mongoose = require('mongoose');
const databaseURL = process.env.DATABASE_URL;

mongoose.connect(databaseURL)
.then(() => {
    console.log('connected to beFit database');
});

mongoose.set('strictQuery', true);


export default mongo;

