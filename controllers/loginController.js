const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.login = async (req, res) => {
  
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  const genSalt = 10;
  const checkPassword = bcrypt.compareSync(password, user.password);

  if (!user) return res.status(400).send("Email does not exist");
  if (!checkPassword) return res.status(400).send("Password does not match");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {expiresIn: '1h' });
  res.status(200).json({ token: token, id: user._id, role: user.role, userName:user.name });
};

