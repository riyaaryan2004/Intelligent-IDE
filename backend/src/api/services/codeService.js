// src/api/services/codeService.js

const geminiService = require('./geminiService');
const CodeSnippet = require('../../models/CodeSnippet');
const Project = require('../../models/Project');
const logger = require('../../utils/logger');
const { APIError } = require('../middleware/errorHandler');

class CodeService {
    async generateCode(params) {
        const { prompt, language, projectId, userId, context = {} } = params;

        try {
            // Generate code using Gemini
            const generatedCode = await geminiService.generateCode(prompt, language, context);
            
            // Analyze the generated code
            const analysis = await geminiService.analyzeCode(generatedCode[0], language);
            
            // Generate tests
            const tests = await geminiService.generateTests(generatedCode[0], language);

            // Create code snippet
            const snippet = await CodeSnippet.create({
                name: prompt.substring(0, 50), // Use first 50 chars of prompt as name
                code: generatedCode[0],
                language,
                project: projectId,
                analysis,
                metadata: {
                    generatedBy: 'gemini',
                    prompt,
                    context,
                    timestamp: new Date()
                }
            });

            // Update project with new snippet
            await Project.findByIdAndUpdate(projectId, {
                $push: { codeSnippets: snippet._id }
            });

            return {
                snippet,
                analysis,
                tests
            };
        } catch (error) {
            logger.error('Error in code generation:', error);
            throw new APIError('Failed to generate code', 500);
        }
    }

    async saveCodeSnippet(params) {
        const { name, code, language, projectId, userId } = params;

        try {
            // Verify project exists and user has access
            const project = await Project.findOne({ _id: projectId, owner: userId });
            if (!project) {
                throw new APIError('Project not found or access denied', 404);
            }

            // Create new code snippet
            const snippet = await CodeSnippet.create({
                name,
                code,
                language,
                project: projectId,
                version: 1,
                history: [{
                    version: 1,
                    code,
                    timestamp: new Date()
                }]
            });

            // Update project
            await Project.findByIdAndUpdate(projectId, {
                $push: { codeSnippets: snippet._id }
            });

            return snippet;
        } catch (error) {
            logger.error('Error saving code snippet:', error);
            throw error;
        }
    }

    async updateCodeSnippet(params) {
        const { snippetId, code, userId } = params;

        try {
            const snippet = await CodeSnippet.findById(snippetId);
            if (!snippet) {
                throw new APIError('Code snippet not found', 404);
            }

            // Verify user has access through project
            const project = await Project.findOne({
                _id: snippet.project,
                owner: userId
            });
            if (!project) {
                throw new APIError('Access denied', 403);
            }

            // Update snippet with version control
            const newVersion = snippet.version + 1;
            snippet.version = newVersion;
            snippet.code = code;
            snippet.history.push({
                version: newVersion,
                code,
                timestamp: new Date()
            });

            await snippet.save();
            return snippet;
        } catch (error) {
            logger.error('Error updating code snippet:', error);
            throw error;
        }
    }

    async getCodeHistory(snippetId) {
        try {
            const snippet = await CodeSnippet.findById(snippetId)
                .select('history')
                .lean();

            if (!snippet) {
                throw new APIError('Code snippet not found', 404);
            }

            return snippet.history;
        } catch (error) {
            logger.error('Error getting code history:', error);
            throw error;
        }
    }

    async analyzeCode(params) {
        const { code, language } = params;

        try {
            const analysis = await geminiService.analyzeCode(code, language);
            return analysis;
        } catch (error) {
            logger.error('Error analyzing code:', error);
            throw new APIError('Failed to analyze code', 500);
        }
    }

    async optimizeCode(params) {
        const { code, language } = params;

        try {
            const prompt = `Optimize this ${language} code for better performance and readability:\n${code}`;
            const optimizedCode = await geminiService.generateCode(prompt, language);
            
            return {
                original: code,
                optimized: optimizedCode[0],
                analysis: await this.analyzeCode({ code: optimizedCode[0], language })
            };
        } catch (error) {
            logger.error('Error optimizing code:', error);
            throw new APIError('Failed to optimize code', 500);
        }
    }
}

module.exports = new CodeService();