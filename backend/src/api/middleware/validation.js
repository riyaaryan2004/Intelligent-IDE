// src/api/middleware/validation.js
const { APIError } = require('./errorHandler');

// Helper functions
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isStrongPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Validation middleware
const validation = {
    validateCodeRequest: () => {
        return (req, res, next) => {
            try {
                if (req.method === 'POST') {
                    const { prompt, language } = req.body;

                    if (!prompt || !language) {
                        throw new APIError('Prompt and language are required', 400);
                    }

                    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
                        throw new APIError('Invalid prompt format', 400);
                    }

                    const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'typescript'];
                    if (!supportedLanguages.includes(language.toLowerCase())) {
                        throw new APIError('Unsupported programming language', 400);
                    }
                }
                
                next();
            } catch (error) {
                next(error);
            }
        };
    },


    validateCodeSnippet: (req, res, next) => {
        try {
            const { name, code, language, projectId } = req.body;

            if (!name || !code || !language || !projectId) {
                throw new APIError('Name, code, language, and project ID are required', 400);
            }

            if (name.trim().length === 0 || code.trim().length === 0) {
                throw new APIError('Name and code cannot be empty', 400);
            }

            next();
        } catch (error) {
            next(error);
        }
     
    },
    validateTestCase: () => {
        return (req, res, next) => {
            try {
                // Validate based on HTTP method
                switch (req.method) {
                    case 'POST':
                    case 'PUT':
                        const { name, testCode, type, codeSnippetId } = req.body;

                        if (!name || !testCode || !type || !codeSnippetId) {
                            throw new APIError('Name, test code, type, and code snippet ID are required', 400);
                        }

                        if (name.trim().length === 0) {
                            throw new APIError('Test name cannot be empty', 400);
                        }

                        if (testCode.trim().length === 0) {
                            throw new APIError('Test code cannot be empty', 400);
                        }

                        const validTypes = ['unit', 'integration', 'e2e'];
                        if (!validTypes.includes(type)) {
                            throw new APIError(`Invalid test type. Must be one of: ${validTypes.join(', ')}`, 400);
                        }
                        break;

                    case 'GET':
                        if (req.params.snippetId && !req.params.snippetId.match(/^[0-9a-fA-F]{24}$/)) {
                            throw new APIError('Invalid snippet ID format', 400);
                        }
                        break;

                    case 'DELETE':
                        if (!req.params.testId || !req.params.testId.match(/^[0-9a-fA-F]{24}$/)) {
                            throw new APIError('Invalid test ID format', 400);
                        }
                        break;
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    },


    validateRegistration: (req, res, next) => {
        try {
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
                throw new APIError('Password must meet security requirements', 400);
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    validateLogin: (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new APIError('Email and password are required', 400);
            }

            if (!isValidEmail(email)) {
                throw new APIError('Invalid email format', 400);
            }

            next();
        } catch (error) {
            next(error);
        }
    }
};

console.log("Validation Middleware Loaded", validation);

module.exports = validation;