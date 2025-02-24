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
            console.log('Generating code with:', { prompt, language, context });
            const generatedCode = await geminiService.generateCode(prompt, language, context);
            console.log('Generated code:', generatedCode);
            if (!generatedCode || !generatedCode[0]) {
                throw new Error("Generated code is empty!");
            }
            
            // Analyze the generated code
            const analysis = await geminiService.analyzeCode(generatedCode[0], language);
            console.log('Code analysis:', analysis);

            // Generate tests
            const tests = await geminiService.generateTests(generatedCode[0], language);
            console.log('Generated tests:', tests);

            if (!projectId) {
                throw new Error("Project ID is required");
            }
            console.log("project id found");
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
            await snippet.save();

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
         console.log("save code in code service");
        try {
            // Verify project exists and user has access
            const project = await Project.findOne({ _id: projectId, owner: userId });
            if (!project) {
                throw new APIError('Project not found or access denied', 404);
            }
            console.log("project found");
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
            console.log("snippet created");
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
            console.log("in code service");
            const analysis = await geminiService.analyzeCode(code, language);
            return analysis;
        } catch (error) {
            logger.error('Error analyzing code:', error);
            throw new APIError('Failed to analyze code', 500);
        }
    }

    async optimizeCode(params) {
        const { code, language,requirements } = params;

        try {
            const prompt = `Optimize the following ${language} code for better performance and readability. Ensure the following improvements: ${requirements}\n\nCode:\n${code}`;
            const optimizedCode = await geminiService.generateCode(prompt, language);
            if (!optimizedCode || optimizedCode.length === 0) {
                throw new APIError('Failed to generate optimized code', 500);
            }
    
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
    async getSnippetById(snippetId) {
        try {
            const snippet = await CodeSnippet.findById(snippetId);
            if (!snippet) {
                throw new APIError("Snippet not found", 404);
            }
            return snippet;
        } catch (error) {
            throw error;
        }
    }
    
}

module.exports = new CodeService();