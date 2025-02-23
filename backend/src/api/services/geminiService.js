// src/api/services/geminiService.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/gemini');
const logger = require('../../utils/logger');
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Check your .env file.");
}

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async generateCode(prompt, language, context = {}) {
        try {
            logger.info('Starting code generation...');
            
            const enhancedPrompt = this.buildCodePrompt(prompt, language, context);
            const result = await this.model.generateContent(enhancedPrompt);
            if (!result || !result.response || !result.response.text) {
                logger.error("Invalid response format from model.");
                throw new Error("Invalid response from model.");
            }
    
            const responseText = await result.response.text();
            logger.info("Model response received.");
    
            const extractedCode = this.extractCodeFromResponse(responseText);
            if (!extractedCode || extractedCode.length === 0) {
                logger.error("Failed to extract code from model response.");
                throw new Error("Failed to extract code from response.");
            }

            return extractedCode;
        } catch (error) {
            logger.error(`Code generation failed: ${error.message}`);
            throw new Error(`Code generation failed: ${error.message}`);              }
    }

    async analyzeCode(code, language) {
        try {
            const analysis = await this.model.generateContent([
                `Analyze this ${language} code for potential improvements, bugs, and security issues:\n${code}`
            ]);
            return this.parseAnalysis(analysis.response.text());
        } catch (error) {
            throw new Error(`Code analysis failed: ${error.message}`);
        }
    }

    async generateTests(code, language) {
        try {
            const testPrompt = `Generate comprehensive unit tests for this ${language} code, including edge cases:\n${code}`;
            const result = await this.model.generateContent(testPrompt);
            return this.extractTestsFromResponse(result.response.text());
        } catch (error) {
            throw new Error(`Test generation failed: ${error.message}`);
        }
    }

    async suggestBugFixes(code, language, error) {
        try {
            const prompt = `Fix the following error in this ${language} code:\nError: ${error}\nCode:\n${code}`;
            const result = await this.model.generateContent(prompt);
            return this.extractBugFixes(result.response.text());
        } catch (error) {
            throw new Error(`Bug fix suggestion failed: ${error.message}`);
        }
    }

    buildCodePrompt(prompt, language, context) {
        const { dependencies = [], requirements = [], constraints = [] } = context;
        return `
            Generate ${language} code for: ${prompt}
            Dependencies: ${dependencies.join(', ')}
            Requirements: ${requirements.join('\n')}
            Constraints: ${constraints.join('\n')}
            Please provide production-ready code with:
            - Error handling
            - Input validation
            - Performance optimization
            - Best practices
            - Documentation
        `;
    }

    extractCodeFromResponse(response) {
        // Extract code blocks from the response
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        const matches = [...response.matchAll(codeBlockRegex)];
        return matches.map(match => match[1].trim());
    }

    parseAnalysis(analysis) {
        return {
            improvements: this.extractSection(analysis, 'Improvements'),
            bugs: this.extractSection(analysis, 'Bugs'),
            securityIssues: this.extractSection(analysis, 'Security Issues'),
            recommendations: this.extractSection(analysis, 'Recommendations')
        };
    }

    extractTestsFromResponse(response) {
        const tests = this.extractCodeFromResponse(response);
        return {
            unitTests: tests.filter(test => test.includes('test') || test.includes('assert')),
            testCases: this.extractSection(response, 'Test Cases'),
            coverage: this.extractSection(response, 'Coverage')
        };
    }

    extractBugFixes(response) {
        return {
            fixes: this.extractCodeFromResponse(response),
            explanation: this.extractSection(response, 'Explanation'),
            recommendations: this.extractSection(response, 'Additional Recommendations')
        };
    }

    extractSection(text, sectionName) {
        const regex = new RegExp(`${sectionName}:[\\n\\r]+((?:(?!\\n\\n|$).)*)`);
        const match = text.match(regex);
        return match ? match[1].trim().split('\n') : [];
    }
}

module.exports = new GeminiService();