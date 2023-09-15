// const db = require('./mongo');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {validationResult} = require("express-validator");


exports.findAll = async (req, res) =>{
  res.status(200).json(await User.find());
};

exports.findOneName = async (req, res) =>{
  let id = req.params.id;
  const userData = await User.findById(id);
  return res.status(200).json(userData.name);
};

exports.findOneEmail = async (req, res) =>{
  let id = req.params.id;
  const userData = await User.findById(id);
  return res.status(200).json(userData.email);
};

exports.findOneId = async (req, res) =>{
  let email = req.params.email;
  const userData = await User.find({"email": email});
  if(!userData[0]) return res.status(201).json(null);
  return res.status(200).json(userData[0]._id);
};


  
exports.create = async (req, res) => {
    const { name, email, password, age, weight, height, goal, role } = req.body;
    const existingUser = await User.findOne( { email: email })
    console.log('req.body', req.body)

    if(existingUser) {
      res.status(409).json({Message:"Username already in use"})
    } 

    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json(errors);
    }
    const genSalt = 10;
    const passwordHashed = bcrypt.hashSync(password, genSalt);
  
    const newUser = new User ({
      name: name,
      email: email,
      password: passwordHashed,
      age: age,
      weight: weight,
      height:height,
      goal:goal, 
      role: role || "basic"
    });
    const userSaved = await newUser.save();
  
    const token = jwt.sign({ id: userSaved._id }, process.env.JWT_SECRET, {expiresIn: '1h' });
    return res.status(201).json({ 
      token: token, 
      id: userSaved._id, 
      role: userSaved.role, 
      userName: userSaved.name  });
    
  };
  
  exports.findOne = async (req, res) =>{

    return res.status(200).json(req.sessionUser);
  };

  exports.delete = (req,res) => {
  const id = req.params.id;

  User.deleteOne({_id: id}, function (err) {
      if (err) return handleError(err);
  });
  
  const deletedUser = req.body;
    res.status(201).json({Message: "Your User was deleted Succesfully",deletedUser});
};


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
};











