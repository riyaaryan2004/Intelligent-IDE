// src/api/middleware/validation.js

const { APIError } = require('./errorHandler');

// Validation helper functions
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Validation middleware functions
const validation = {
    validateRegistration: (req, res, next) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            throw new APIError('All fields are required', 400);
        }

        if (username.length < 3) {
            throw new APIError('Username must be at least 3 characters long', 400);
        }

        if (!isValidEmail(email)) {
            throw new APIError('Invalid email format', 400);
        }

        if (!isStrongPassword(password)) {
            throw new APIError(
                'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                400
            );
        }

        next();
    },

    validateLogin: (req, res, next) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new APIError('Email and password are required', 400);
        }

        if (!isValidEmail(email)) {
            throw new APIError('Invalid email format', 400);
        }

        next();
    },

    validateCodeRequest: (req, res, next) => {
        const { prompt, language } = req.body;

        if (!prompt || !language) {
            throw new APIError('Prompt and language are required', 400);
        }

        if (typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new APIError('Invalid prompt format', 400);
        }

        // Add supported languages here
        const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'typescript'];
        if (!supportedLanguages.includes(language.toLowerCase())) {
            throw new APIError('Unsupported programming language', 400);
        }

        next();
    },

    validateCodeSnippet: (req, res, next) => {
        const { name, code, language, projectId } = req.body;

        if (!name || !code || !language || !projectId) {
            throw new APIError('Name, code, language, and project ID are required', 400);
        }

        if (name.trim().length === 0) {
            throw new APIError('Invalid snippet name', 400);
        }

        if (code.trim().length === 0) {
            throw new APIError('Code cannot be empty', 400);
        }

        next();
    },

    validateTestCase: (req, res, next) => {
        const { name, testCode, type, codeSnippetId } = req.body;

        if (!name || !testCode || !type || !codeSnippetId) {
            throw new APIError('Name, test code, type, and code snippet ID are required', 400);
        }

        const validTypes = ['unit', 'integration', 'e2e'];
        if (!validTypes.includes(type)) {
            throw new APIError('Invalid test type', 400);
        }

        next();
    },

    validatePipeline: (req, res, next) => {
        const { projectId, config } = req.body;

        if (!projectId || !config) {
            throw new APIError('Project ID and pipeline configuration are required', 400);
        }

        if (!config.stages || !Array.isArray(config.stages) || config.stages.length === 0) {
            throw new APIError('Pipeline must have at least one stage', 400);
        }

        next();
    },

    validateProjectUpdate: (req, res, next) => {
        const { name, description, language } = req.body;

        if (!name || !description || !language) {
            throw new APIError('Name, description, and language are required', 400);
        }

        if (name.trim().length === 0) {
            throw new APIError('Invalid project name', 400);
        }

        next();
    }
};

module.exports = validation;