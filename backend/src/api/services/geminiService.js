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
            throw new Error(`Code generation failed: ${error.message}`);
        }
    }

    async analyzeCode(code, language) {
        try {
            console.log("inside gemini sevice analyse code");
            const prompt = `You are an expert code analyzer specializing in ${language} performance and security. Analyze the following ${language} code, focusing on time complexity, security vulnerabilities, and adherence to best practices. Provide your response in this structured JSON format:

                {
                "improvements": [
                    {
                    "description": "Detailed explanation of the improvement.",
                    "reason": "Why this improvement is necessary.",
                    "codeFix": "Example code fix, if applicable."
                    }
                ],
                "bugs": [
                    {
                    "description": "Description of the bug.",
                    "location": "Line number or code section.",
                    "fix": "Corrected code or explanation of the fix."
                    }
                ],
                "securityIssues": [
                    {
                    "vulnerability": "Type of vulnerability (e.g., SQL injection, XSS).",
                    "location": "Code section.",
                    "mitigation": "Strategies to prevent the vulnerability."
                    }
                ],
                "recommendations": [
                    "Best practices and coding style suggestions."
                ]
                }

                Here is the ${language} code:
                \`\`\`${language}
                ${code}
                \`\`\`

                Prioritize critical security issues and bugs. Make sure all fields are present, even if they are empty arrays. Provide detailed explanations for each improvement, bug, and security issue. If possible provide time and space complexity analysis.
                `;

            const analysis = await this.model.generateContent([prompt]);

            const responseText = typeof analysis.text === 'function'
                ? await analysis.text()
                : analysis.response ? await analysis.response.text() : '';

            console.log("Raw Response:", responseText, " done");

            if (!responseText) {
                throw new Error("Empty response from AI model");
            }
            const parsedAnalysis = this.parseAnalysis(responseText);
            return parsedAnalysis;

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
        if (!analysis || typeof analysis !== "string") {
            console.error("🚨 Invalid analysis provided to parseAnalysis:", analysis);
            return { improvements: [], bugs: [], securityIssues: [], recommendations: [] };
        }
        try {
            // 🚀 Remove backticks and trim whitespace
            const cleanText = analysis.replace(/```json|```/g, "").trim();
            
            console.log("📌 Cleaned Response Text:", cleanText);
            const parsedData = JSON.parse(cleanText);
            console.log("✅ Parsed JSON:", parsedData);
    
            return {
                improvements: parsedData.improvements || [],
                bugs: parsedData.bugs || [],
                securityIssues: parsedData.securityIssues || [],
                recommendations: parsedData.recommendations || []
            };
        } catch (error) {
            console.error("🚨 JSON Parse Error:", error);
            console.error("🚨 Raw Response (Before Cleanup):", analysis);
            throw new Error("Invalid JSON received from GeminiService");
        }
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