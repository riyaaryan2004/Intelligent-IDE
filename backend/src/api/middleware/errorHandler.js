// src/api/middleware/errorHandler.js

const logger = require('../../utils/logger');

// Custom error class for API errors
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // Handle specific types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'fail',
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'fail',
            error: 'Invalid ID',
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            status: 'fail',
            error: 'Duplicate Field Error',
            message: `${field} already exists`
        });
    }

    // Production response
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Programming or unknown errors: don't leak error details
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
    });
};

// Async error handler wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    catchAsync,
    APIError
};