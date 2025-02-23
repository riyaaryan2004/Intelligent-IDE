// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Load environment variables
dotenv.config();

// Import logger
const logger = require('./src/utils/logger');

// Import database configuration
const { connectDB } = require('./src/api/config/database');

// Import routes
const codeRoutes = require('./src/api/routes/codeRoutes');
const testRoutes = require('./src/api/routes/testRoutes');
const debugRoutes = require('./src/api/routes/debugRoutes');
const projectRoutes = require('./src/api/routes/projectRoutes');
const authRoutes = require('./src/api/routes/authRoutes');

// Import middleware
const { errorHandler } = require('./src/api/middleware/errorHandler');
const { auth } = require('./src/api/middleware/auth');

// Initialize express app
const app = express();
// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
// Security middleware

app.use(helmet()); // Adds various HTTP headers for security
app.use(compression()); // Compress responses

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));



// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/code', auth, codeRoutes);
app.use('/api/test', auth, testRoutes);
app.use('/api/debug', auth, debugRoutes);
app.use('/api/projects', auth, projectRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

// Global error handling
app.use(errorHandler);
console.log("helloooooooooooo");

// Graceful shutdown function
const gracefulShutdown = async () => {
    try {
        logger.info('📡 Received shutdown signal. Starting graceful shutdown...');
        
        // Close database connection
        await mongoose.connection.close();
        logger.info('✅ Database connection closed.');
        
        // Close server
        server.close(() => {
            logger.info('✅ Server closed.');
            process.exit(0);
        });

        // Force close after 10s
        setTimeout(() => {
            logger.error('❌ Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);

    } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
    logger.error('❌ UNHANDLED REJECTION:', err);
    // Don't exit in production, but log the error
    if (process.env.NODE_ENV === 'development') {
        throw err;
    }
});

// Start server function
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        logger.info('✅ Database connection established');

        // Start server
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            logger.error('❌ Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();