const mongoose = require('mongoose');
const databaseURL = process.env.DATABASE_URL;

mongoose.connect(databaseURL)
.then(() => {
    console.log('connected to beFit database');
});

set('strictQuery', false);


export default mongo;

