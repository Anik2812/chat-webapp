const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id }).populate('participants', 'username');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const newChat = new Chat({
      participants: [req.user.id, participantId]
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat' });
  }
});

module.exports = router;