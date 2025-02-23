// src/api/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 1 * 60 * 1000, // 15 minutes default
        max: options.max || 50, // Limit each IP to 50 requests per windowMs default
        message: { error: options.message || "Too many requests, please try again later." },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Create default limiter
const defaultLimiter = createRateLimiter();

console.log("Rate Limiter Middleware Loaded", typeof createRateLimiter);

module.exports = createRateLimiter;
// You can also export the default limiter if needed
// module.exports = { createRateLimiter, defaultLimiter };