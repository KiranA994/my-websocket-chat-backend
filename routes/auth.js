const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User')
const crypto = require('crypto');
const router = express.Router();
const secretKey = crypto.randomBytes(64).toString('hex');
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, username, password: hashed });
    await user.save();
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (e) {
    res.status(400).json({ error: "Registration failed" });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id, username: user.username }, secretKey);
  res.status(201).json({ message: "Login Successfull", token, username: user.username });
});

module.exports = {
  router,
  secretKey
}
