const express = require('express');
const Group = require('../models/Group');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'username avatar')
      .populate('admin', 'username')
      .sort('-updatedAt');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const newGroup = new Group({
      name,
      members: [req.user._id],
      admin: req.user._id
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: 'Error creating group' });
  }
});

router.post('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    group.messages.push({ sender: req.user._id, content });
    await group.save();
    res.status(201).json(group.messages[group.messages.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
});

module.exports = router;