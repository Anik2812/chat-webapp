const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Make sure to import jwt
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the authenticateToken middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/users/me', authenticateToken, (req, res) => {
  // Assuming the user data is attached to the request after authentication
  res.json(req.user);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));