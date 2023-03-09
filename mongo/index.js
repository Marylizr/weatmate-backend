import { connect, connection, set } from 'mongoose';
const databaseURL = process.env.DATABASE_URL;

connect(databaseURL);

const mongo = connection;
mongo.on('error', (error) => console.error(error));
mongo.once('open', () => {
    console.log('connected to beFit database');
});

set('strictQuery', false);


export default mongo;

