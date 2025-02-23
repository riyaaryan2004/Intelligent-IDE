// backend/src/api/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = auth;

// backend/src/api/middleware/validation.js
const validation = {
  validateProject: (req, res, next) => {
    const { name, language } = req.body;
    
    if (!name || !language) {
      return res.status(400).json({ 
        error: 'Project name and language are required' 
      });
    }
    
    next();
  },

  validateCodeSnippet: (req