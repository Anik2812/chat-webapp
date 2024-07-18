const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.sendStatus(403);

    try {
      const user = await User.findById(payload.userId).select('-password');
      
      if (!user) {
        return res.sendStatus(404);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error in authentication middleware:', error);
      res.sendStatus(500);
    }
  });
}

module.exports = authenticateToken;