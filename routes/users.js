const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = { username, email };
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

module.exports = router;