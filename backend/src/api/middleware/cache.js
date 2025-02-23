const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        // Save original `res.json` method
        const originalJson = res.json;

        res.json = (body) => {
            cache.set(key, body, duration);  // Store response in cache
            originalJson.call(res, body);   // Call original json method
        };

        next();
    };
};
console.log("cache Middleware Loaded", cacheMiddleware);

module.exports = cacheMiddleware;
