// src/api/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../utils/logger');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user
            const user = await User.findById(decoded.userId)
                .select('-password') // Exclude password
                .lean(); // Convert to plain object

            if (!user) {
                throw new Error('User not found');
            }

            // Add user and token to request
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

// Optional: Role-based authentication middleware
const authRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    };
};

module.exports = {
    auth,
    authRole
};