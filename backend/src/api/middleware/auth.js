// src/api/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Auth middleware - return the function directly
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password').lean();

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token has expired' });
            }
            throw error;
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Please authenticate properly' });
    }
};

// Role-based auth middleware
const authRole = (allowedRoles) => async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    } catch (error) {
        logger.error('Role authorization error:', error);
        res.status(403).json({ error: 'Access denied' });
    }
};

console.log("Auth Middleware Loaded", { auth, authRole });

module.exports = {
    auth,
    authRole
};