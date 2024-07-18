const express = require('express');
const Chat = require('../models/Chat');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username avatar')
      .sort('-updatedAt');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const newChat = new Chat({
      participants: [req.user._id, participantId]
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat' });
  }
});

router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    chat.messages.push({ sender: req.user._id, content });
    chat.lastMessage = content;
    await chat.save();
    res.status(201).json(chat.messages[chat.messages.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
});

module.exports = router;