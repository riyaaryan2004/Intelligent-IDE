// src/api/config/database.js

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

// Database connection options
const dbConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    autoIndex: true
};

// Initialize database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, dbConfig);
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Set up connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        logger.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Disconnect from database
const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info('✅ MongoDB disconnected successfully');
    } catch (error) {
        logger.error('❌ Error disconnecting from MongoDB:', error);
        throw error;
    }
};

// Get database connection status
const getDBStatus = () => ({
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
});

module.exports = {
    connectDB,
    disconnectDB,
    getDBStatus,
    dbConfig
};