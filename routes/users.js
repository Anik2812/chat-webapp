const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/online', authenticateToken, async (req, res) => {
  try {
    const onlineUsers = await User.find({ online: true }).select('-password');
    res.json(onlineUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching online users' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

module.exports = router;