const jwt = require("jsonwebtoken");
const User = require('../models/userModel');

exports.authMiddleware = async (req, res, next) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    let tokenData;
    try {
        tokenData = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (e) {
        return res.status(400).send("Invalid token");
    }

    const user = await User.findById(tokenData.id);
    if(user){
        req.sessionUser = user;
    }
    next();

};

exports.IsAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. No user information found.' });
    }
  
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  
    next();
  };
  
    