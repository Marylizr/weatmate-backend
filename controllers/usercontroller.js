// const db = require('./mongo');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {roles} = require('../roles');

 
 
async function hashPassword(password) {
 return await bcrypt.hash(password, 10);
}
 
async function validatePassword(plainPassword, hashedPassword) {
 return await bcrypt.compare(plainPassword, hashedPassword);
}
 
exports.signup = async (req, res, next) => {
  
 try {
  const { name, email, password, role, age, height, weight, goals } = req.body;
  const hashedPassword = await hashPassword(password);
  const newUser = new User(
    { name: name,
      email: email,
      password: hashedPassword,
      role: role || "basic",
      age: age,
      height: height,
      weight: weight,
      goals:goals
  });
  const accessToken = jwt.sign({ userId: newUser._id, role:newUser.role }, process.env.JWT_SECRET, {
   expiresIn: "1d"
  });
  newUser.accessToken = accessToken;
  await newUser.save();
  res.json({
   data: newUser,
   accessToken
  })
 } catch (error) {
  next(error)
 }
}
 

  exports.login = async (req, res, next) => {

   async function validatePassword(plainPassword, hashPassword) {
       return await bcrypt.compare(plainPassword, hashPassword);
   }

   try {
    const {  email, password } = req.body;
    const user = await User.findOne({ email });
      if (!user) 
        return 
          next(new Error('Email does not exist'));

    const validPassword = await validatePassword(password, user.password);
      if (!validPassword) 
        return next(new Error('Password is not correct'));

     const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, 
      { expiresIn: "1H"
    });
    await User.findByIdAndUpdate(user._id, { accessToken })
      res.status(200).json({
      data: { email: user.email, role: user.role },
      accessToken
  })
   } catch (error) {
    next(error);
   }
  }

  exports.update = async (req,res) => {
   const user = req.sessionUser;
   const id = user._id
   const data = req.body;
 
   savedUser = await User.find({_id:id});
 
   if (data.password && data.password.length>0 && data.password !== savedUser[0].password) {
     const genSalt = 10;
     const passwordHashed = bcrypt.hashSync(data.password, genSalt);
     data.password=passwordHashed;
   } 
   
   else {
     data.password = savedUser.password;
   }
   const updatedUser = await User.findOneAndUpdate({_id: id},data)
   return res.status(200).json({ message: "Your user has been updated succesfully", updatedUser});
}

exports.delete = (req,res) => {
   const id = req.params.id;
 
   User.deleteOne({_id: id}, function (err) {
     if (err) return handleError(err);
 });
 
 const deletedUser = req.body;
   res.status(201).json({Message: "Your User was deleted Succesfully",deletedUser});
};

exports.getUsers = async (req, res, next) => {
   const users = await User.find({});
   res.status(200).json({
    data: users
   });
  }
   
  exports.getUser = async (req, res, next) => {
   try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) return next(new Error('User does not exist'));
     res.status(200).json({user});
   } catch (error) {
    next(error)
   }
  }
   
  exports.updateUser = async (req, res, next) => {
   try {
    const update = req.body
    const id = req.params.id;
    await User.findByIdAndUpdate(id, update);
    const user = await User.findById(id)
    res.status(200).json({
     data: user,
     message: 'User has been updated'
    });
   } catch (error) {
    next(error)
   }
  }
   
  exports.deleteUser = async (req, res, next) => {
   try {
    const id = req.params.id;
    await User.findByIdAndDelete(id);
    res.status(200).json({
     data: null,
     message: 'User has been deleted'
    });
   } catch (error) {
    next(error)
   }
  }
   


  exports.grantAccess = function(action, resource) {
    return async (req, res, next) => {
     try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
       return res.status(401).json({
        error: "You don't have enough permission to perform this action"
       });
      }
      next()
     } catch (error) {
      next(error)
     }
    }
   }
    
   exports.allowIfLoggedin = async (req, res, next) => {
    try {
     const user = res.locals.loggedInUser;
     if (!user)
      return res.status(401).json({
       error: "You need to be logged in to access this route"
      });
      req.user = user;
      next();
     } catch (error) {
      next(error);
     }
   }



  //  {
    // "role":"admin",
    // "name":"Mary",
    // "email":"marylizr@gmail.com",
    // "password":"laotraclave",
    // "age":20,
    // "weight": 60,
    // "height": 168,
    // "goal": "weight-lost"
  //   }