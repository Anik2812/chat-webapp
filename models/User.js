const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: 'default-avatar.png' },
  online: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);