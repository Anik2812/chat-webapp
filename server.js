const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users'); 


const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 

app.get('/api/users/me', authenticateToken, (req, res) => {
    // Assuming the user data is attached to the request after authentication
    res.json(req.user);
  });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

