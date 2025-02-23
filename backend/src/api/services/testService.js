// src/api/services/testService.js

const geminiService = require('./geminiService');
const TestCase = require('../../models/TestCase');
const CodeSnippet = require('../../models/CodeSnippet');
const logger = require('../../utils/logger');
const { APIError } = require('../middleware/errorHandler');

class TestService {
    async generateTests(params) {
        const { code, language, coverage = 80 } = params;

        try {
            // Generate tests using Gemini
            const tests = await geminiService.generateTests(code, language);
            
            return {
                unitTests: tests.unitTests,
                testCases: tests.testCases,
                coverage: tests.coverage,
                suggestions: this.generateTestSuggestions(tests)
            };
        } catch (error) {
            logger.error('Error generating tests:', error);
            throw new APIError('Failed to generate tests', 500);
        }
    }

    async saveTestCase(params) {
        const { name, testCode, type, codeSnippetId } = params;

        try {
            // Verify code snippet exists
            const snippet = await CodeSnippet.findById(codeSnippetId);
            if (!snippet) {
                throw new APIError('Code snippet not found', 404);
            }

            // Create test case
            const testCase = await TestCase.create({
                name,
                testCode,
                type,
                codeSnippet: codeSnippetId,
                status: 'pending'
            });

            // Update code snippet with test reference
            await CodeSnippet.findByIdAndUpdate(codeSnippetId, {
                $push: { tests: testCase._id }
            });

            return testCase;
        } catch (error) {
            logger.error('Error saving test case:', error);
            throw error;
        }
    }

    async runTests(params) {
        const { code, tests, language } = params;

        try {
            const results = [];
            for (const test of tests) {
                const result = await this.executeTest(code, test, language);
                results.push(result);
            }

            return {
                passed: results.every(r => r.status === 'passed'),
                results,
                summary: this.generateTestSummary(results)
            };
        } catch (error) {
            logger.error('Error running tests:', error);
            throw new APIError('Failed to run tests', 500);
        }
    }

    async executeTest(code, test, language) {
        try {
            // Here you would integrate with actual test runners
            // This is a placeholder implementation
            const startTime = Date.now();
            
            // Simulate test execution
            const passed = Math.random() > 0.2; // 80% pass rate for simulation
            
            return {
                status: passed ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                error: passed ? null : 'Test assertion failed',
                coverage: {
                    lines: Math.floor(Math.random() * 20) + 80,
                    functions: Math.floor(Math.random() * 20) + 80,
                    branches: Math.floor(Math.random() * 20) + 80
                }
            };
        } catch (error) {
            return {
                status: 'error',
                duration: 0,
                error: error.message
            };
        }
    }

    generateTestSuggestions(tests) {
        // Analyze test coverage and generate suggestions
        const suggestions = [];
        
        if (tests.coverage < 80) {
            suggestions.push('Increase test coverage to at least 80%');
        }
        
        if (!tests.testCases.some(tc => tc.includes('edge case'))) {
            suggestions.push('Add tests for edge cases');
        }
        
        if (!tests.testCases.some(tc => tc.includes('error'))) {
            suggestions.push('Add error handling tests');
        }
        
        return suggestions;
    }

    generateTestSummary(results) {
        const total = results.length;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = total - passed;
        
        const averageDuration = results.reduce((acc, curr) => acc + curr.duration, 0) / total;
        
        return {
            total,
            passed,
            failed,
            successRate: (passed / total) * 100,
            averageDuration
        };
    }

    async getTestHistory(snippetId) {
        try {
            const tests = await TestCase.find({ codeSnippet: snippetId })
                .sort({ createdAt: -1 })
                .lean();

            return tests;
        } catch (error) {
            logger.error('Error getting test history:', error);
            throw error;
        }
    }
}

module.exports = new TestService();