// const db = require('./mongo');
const Contact = require('../models/contactModel');
const bcrypt = require('bcrypt');



   exports.findAll = async (req, res) =>{
      res.status(200).json(await Contact.find());
   };

   exports.findOne = async (req, res) =>{
      return res.status(200).json(req.sessionUser);
 };
  
   exports.create = async (req, res) => {
      const { name, email,message } = req.body;
   
      const newMessage = new Contact ({
         name: name,
         email: email,
         message: message
    });
    const messageSaved = await newMessage.save();
  
    return res.status(201).json(messageSaved);
  };
  
 

   exports.delete = (req,res) => {
      const id = req.params.id;

      Contact.deleteOne({_id: id}, function (err) {
      if (err) return handleError(err);
   });
      const deleteMessage = req.body;
      res.status(201).json({Message: "Your message was deleted Succesfully", deleteMessage});
};












