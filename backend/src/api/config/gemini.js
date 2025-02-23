// src/api/config/gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../../utils/logger');

// Gemini API configuration
const geminiConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-pro",
    settings: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
    },
    // Retry configuration
    retry: {
        maxRetries: 3,
        initialDelay: 1000, // 1 second
        maxDelay: 5000     // 5 seconds
    }
};

// Initialize Gemini client
const initializeGemini = () => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }

        const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
        const model = genAI.getGenerativeModel({ 
            model: geminiConfig.model,
            ...geminiConfig.settings
        });

        logger.info('✅ Gemini API initialized successfully');

        return {
            genAI,
            model,
            async generateContent(prompt, options = {}) {
                try {
                    const result = await model.generateContent(prompt);
                    return result.response.text();
                } catch (error) {
                    logger.error('❌ Gemini API Error:', error);
                    throw error;
                }
            },
            async generateContentWithRetry(prompt, options = {}) {
                let lastError;
                let delay = geminiConfig.retry.initialDelay;

                for (let attempt = 1; attempt <= geminiConfig.retry.maxRetries; attempt++) {
                    try {
                        const result = await model.generateContent(prompt);
                        return result.response.text();
                    } catch (error) {
                        lastError = error;
                        logger.warn(`⚠️ Gemini API attempt ${attempt} failed:`, error);

                        if (attempt < geminiConfig.retry.maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                            delay = Math.min(delay * 2, geminiConfig.retry.maxDelay);
                        }
                    }
                }

                throw new Error(`Failed after ${geminiConfig.retry.maxRetries} attempts: ${lastError.message}`);
            }
        };
    } catch (error) {
        logger.error('❌ Error initializing Gemini API:', error);
        throw error;
    }
};

// Generate code-specific prompt
const generateCodePrompt = ({ language, task, context = {} }) => {
    return {
        prompt: `Generate ${language} code for: ${task}\n` +
               `Context: ${JSON.stringify(context)}\n` +
               'Please provide production-ready code with proper error handling, ' +
               'input validation, and documentation.',
        ...geminiConfig.settings
    };
};

// Generate test-specific prompt
const generateTestPrompt = ({ code, language }) => {
    return {
        prompt: `Generate comprehensive unit tests for this ${language} code:\n${code}\n` +
               'Include test cases for edge cases and error scenarios.',
        ...geminiConfig.settings
    };
};

module.exports = {
    geminiConfig,
    initializeGemini,
    generateCodePrompt,
    generateTestPrompt
};