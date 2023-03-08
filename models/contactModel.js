const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const contactSchema = new Schema({
   name: String,
   email: String,
   message: String
});

const Contact = mongoose.model("contact", contactSchema);

module.exports = Contact;