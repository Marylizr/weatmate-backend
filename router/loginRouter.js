const express = require('express');
const  loginController  = require('../controllers/loginController');


const loginRouter = express.Router();

loginRouter.post('/login', loginController.login);


module.exports = loginRouter;

res.cookie('token', token, {
   httpOnly: true,  // Prevents JavaScript from accessing the token
   secure: true,    // Ensures it's sent only over HTTPS
   sameSite: 'None' // Required for cross-origin requests (important for Netlify + Heroku)
 });
 