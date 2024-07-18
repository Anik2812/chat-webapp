const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', { username, password: '****' });
      
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      res.json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error logging in', details: error.message });
    }
  });

module.exports = router;