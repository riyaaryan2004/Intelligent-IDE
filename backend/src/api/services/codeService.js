// src/api/services/codeService.js

const geminiService = require('./geminiService');
const CodeSnippet = require('../../models/CodeSnippet');
const codeParser = require('../../utils/codeParser');
const logger = require('../../utils/logger');

class CodeService {
    async generateCode(params) {
        const { prompt, language, context = {} } = params;
        
        try {
            // Generate code using Gemini
            const generatedCode = await geminiService.generateCode(prompt, language, context);
            
            // Parse and analyze the generated code
            const parsedCode = await codeParser.parse(generatedCode[0], language);
            const analysis = await geminiService.analyzeCode(generatedCode[0], language);
            
            // Generate tests for the code
            const tests = await geminiService.generateTests(generatedCode[0], language);
            
            // Save the code snippet
            const snippet = await CodeSnippet.create({
                code: generatedCode[0],
                language,
                prompt,
                analysis,
                tests: tests.unitTests,
                metadata: {
                    context,
                    parsedStructure: parsedCode,
                    generatedAt: new Date()
                }
            });
            
            return {
                snippet,
                analysis,
                tests
            };
        } catch (error) {
            logger.error('Code generation failed:', error);
            throw error;
        }
    }

    async debugCode(params) {
        const { code, language, error } = params;
        
        try {
            // Analyze the code for potential issues
            const analysis = await geminiService.analyzeCode(code, language);
            
            // Get bug fix suggestions if there's an error
            const bugFixes = error ? 
                await geminiService.suggestBugFixes(code, language, error) : 
                null;
            
            // Generate tests to verify the fix
            const tests = await geminiService.generateTests(code, language);
            
            return {
                analysis,
                bugFixes,
                tests
            };
        } catch (error) {
            logger.error('Code debugging failed:', error);
            throw error;
        }
    }

    async optimizeCode(params) {
        const { code, language, requirements = [] } = params;
        
        try {
            // Analyze current code
            const analysis = await geminiService.analyzeCode(code, language);
            
            // Generate optimized version
            const optimizedCode = await geminiService.generateCode(
                'Optimize this code: ' + code,
                language,
                { requirements }
            );
            
            // Generate tests to verify optimization
            const tests = await geminiService.generateTests(optimizedCode[0], language);
            
            return {
                originalAnalysis: analysis,
                optimizedCode: optimizedCode[0],
                tests,
                improvements: this.compareVersions(code, optimizedCode[0])
            };
        } catch (error) {
            logger.error('Code optimization failed:', error);
            throw error;
        }
    }

    async generateTestSuite(params) {
        const { code, language, coverage = 80 } = params;
        
        try {
            // Generate comprehensive tests
            const tests = await geminiService.generateTests(code, language);
            
            // Analyze test coverage
            const analysis = await geminiService.analyzeCode(tests.unitTests.join('\n'), language);
            
            return {
                tests,
                analysis,
                coverage: this.calculateCoverage(tests, code)
            };
        } catch (error) {
            logger.error('Test generation failed:', error);
            throw error;
        }
    }

    compareVersions(original, optimized) {
        // Compare code versions and identify improvements
        const improvements = {
            performance: [],
            readability: [],
            maintenance: []
        };
        
        // Add comparison logic here
        
        return improvements;
    }

    calculateCoverage(tests, code) {
        // Calculate test coverage metrics
        return {
            percentage: 0, // Add coverage calculation logic
            uncoveredLines: [],
            suggestions: []
        };
    }
}

module.exports = new CodeService();