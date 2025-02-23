// src/api/services/debugService.js

const geminiService = require('./geminiService');
const logger = require('../../utils/logger');
const { APIError } = require('../middleware/errorHandler');

class DebugService {
    constructor() {
        this.activeSessions = new Map();
        this.breakpoints = new Map();
    }

    async analyzeCode(params) {
        const { code, language } = params;

        try {
            // Get initial analysis from Gemini
            const analysis = await geminiService.analyzeCode(code, language);
            
            // Enhanced bug detection
            const bugAnalysis = await this.detectPotentialBugs(code, language);
            
            // Static code analysis
            const staticAnalysis = await this.performStaticAnalysis(code, language);

            return {
                ...analysis,
                potentialBugs: bugAnalysis,
                staticAnalysis,
                suggestions: this.generateDebugSuggestions(analysis, bugAnalysis, staticAnalysis)
            };
        } catch (error) {
            logger.error('Error analyzing code for debugging:', error);
            throw new APIError('Failed to analyze code', 500);
        }
    }

    async detectPotentialBugs(code, language) {
        try {
            const prompt = `Analyze this ${language} code and identify potential bugs, including:
                - Null pointer exceptions
                - Memory leaks
                - Race conditions
                - Infinite loops
                - Off-by-one errors
                - Resource leaks
                - Unhandled exceptions
                Code: ${code}`;

            const result = await geminiService.generateContent(prompt);
            return this.parseBugAnalysis(result);
        } catch (error) {
            logger.error('Error detecting bugs:', error);
            throw new APIError('Failed to detect bugs', 500);
        }
    }

    async performStaticAnalysis(code, language) {
        // Perform static code analysis based on language
        const analysis = {
            complexity: this.calculateComplexity(code),
            unusedVariables: this.findUnusedVariables(code),
            duplicateCode: this.findDuplicateCode(code),
            securityIssues: await this.checkSecurityIssues(code, language)
        };

        return analysis;
    }

    calculateComplexity(code) {
        // Calculate cyclomatic complexity
        let complexity = 1;
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s*{/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /case\s+.+:/g,
            /catch\s*\(/g,
            /&&/g,
            /\|\|/g,
            /\?/g
        ];

        complexityPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return {
            score: complexity,
            level: this.getComplexityLevel(complexity)
        };
    }

    getComplexityLevel(complexity) {
        if (complexity <= 5) return 'Low';
        if (complexity <= 10) return 'Moderate';
        if (complexity <= 20) return 'High';
        return 'Very High';
    }

    findUnusedVariables(code) {
        // Simple unused variable detection
        const declarations = code.match(/(?:let|const|var)\s+(\w+)/g) || [];
        const variables = declarations.map(d => d.split(/\s+/)[1]);
        
        return variables.filter(variable => {
            const usage = new RegExp(`\\b${variable}\\b`, 'g');
            return (code.match(usage) || []).length <= 1;
        });
    }

    findDuplicateCode(code) {
        // Simple duplicate code detection
        const lines = code.split('\n');
        const duplicates = [];
        
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[i].trim() === lines[j].trim() && lines[i].trim().length > 10) {
                    duplicates.push({
                        line: lines[i].trim(),
                        locations: [i + 1, j + 1]
                    });
                }
            }
        }
        
        return duplicates;
    }

    async checkSecurityIssues(code, language) {
        const prompt = `Identify security vulnerabilities in this ${language} code, including:
            - SQL injection
            - XSS vulnerabilities
            - Insecure direct object references
            - Security misconfigurations
            Code: ${code}`;

        const result = await geminiService.generateContent(prompt);
        return this.parseSecurityIssues(result);
    }

    async suggestFixes(params) {
        const { code, language, error } = params;

        try {
            const prompt = `Fix the following error in this ${language} code and explain the solution:
                Error: ${error}
                Code: ${code}`;

            const result = await geminiService.generateContent(prompt);
            return this.parseBugFixes(result);
        } catch (error) {
            logger.error('Error suggesting fixes:', error);
            throw new APIError('Failed to suggest fixes', 500);
        }
    }

    async startDebugSession(params) {
        const { code, language, breakpoints } = params;

        try {
            const sessionId = `debug-${Date.now()}`;
            const session = {
                id: sessionId,
                code,
                language,
                breakpoints: new Set(breakpoints),
                variables: {},
                callStack: [],
                status: 'initialized',
                startTime: new Date(),
                history: []
            };

            this.activeSessions.set(sessionId, session);
            return sessionId;
        } catch (error) {
            logger.error('Error starting debug session:', error);
            throw new APIError('Failed to start debug session', 500);
        }
    }

    async getVariableState(sessionId, lineNumber) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new APIError('Debug session not found', 404);
        }

        try {
            // Simulate variable state at specific line
            const state = await this.analyzeVariableState(session.code, lineNumber);
            session.variables = state;
            
            return {
                variables: state,
                callStack: session.callStack,
                lineNumber
            };
        } catch (error) {
            logger.error('Error getting variable state:', error);
            throw new APIError('Failed to get variable state', 500);
        }
    }

    async analyzeVariableState(code, lineNumber) {
        // This is a placeholder implementation
        // In a real implementation, this would integrate with actual debugger
        return {
            localVariables: {},
            globalVariables: {},
            scope: 'function',
            timestamp: new Date()
        };
    }

    parseBugAnalysis(result) {
        // Parse bug analysis result from Gemini
        const categories = ['NullPointer', 'MemoryLeak', 'RaceCondition', 'InfiniteLoop', 'LogicError'];
        const bugs = {};

        categories.forEach(category => {
            const regex = new RegExp(`${category}:([^\\n]+)`, 'g');
            const matches = result.match(regex);
            if (matches) {
                bugs[category] = matches.map(m => m.split(':')[1].trim());
            }
        });

        return bugs;
    }

    parseSecurityIssues(result) {
        // Parse security analysis result
        const categories = ['SQLInjection', 'XSS', 'IDOR', 'Configuration'];
        const issues = {};

        categories.forEach(category => {
            const regex = new RegExp(`${category}:([^\\n]+)`, 'g');
            const matches = result.match(regex);
            if (matches) {
                issues[category] = matches.map(m => m.split(':')[1].trim());
            }
        });

        return issues;
    }

    parseBugFixes(result) {
        return {
            fixes: this.extractCodeFromResponse(result),
            explanation: this.extractExplanation(result)
        };
    }

    extractCodeFromResponse(response) {
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        const matches = [...response.matchAll(codeBlockRegex)];
        return matches.map(match => match[1].trim());
    }

    extractExplanation(response) {
        const explanationRegex = /Explanation:([\s\S]*?)(?=```|$)/;
        const match = response.match(explanationRegex);
        return match ? match[1].trim() : '';
    }

    generateDebugSuggestions(analysis, bugAnalysis, staticAnalysis) {
        const suggestions = [];

        // Add suggestions based on complexity
        if (staticAnalysis.complexity.level === 'High' || staticAnalysis.complexity.level === 'Very High') {
            suggestions.push('Consider breaking down complex functions into smaller, more manageable pieces');
        }

        // Add suggestions for unused variables
        if (staticAnalysis.unusedVariables.length > 0) {
            suggestions.push(`Remove unused variables: ${staticAnalysis.unusedVariables.join(', ')}`);
        }

        // Add suggestions for duplicate code
        if (staticAnalysis.duplicateCode.length > 0) {
            suggestions.push('Consider refactoring duplicate code into reusable functions');
        }

        // Add bug-specific suggestions
        Object.entries(bugAnalysis).forEach(([category, bugs]) => {
            if (bugs.length > 0) {
                suggestions.push(`Fix ${category} issues: ${bugs.join(', ')}`);
            }
        });

        return suggestions;
    }
}

module.exports = new DebugService();