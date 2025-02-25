// src/api/routes/codeRoutes.js
const express = require('express');
const router = express.Router();
const codeService = require('../services/codeService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
//const rateLimit = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');
const logger = require('../../utils/logger');

// Create rate limiter instance
//const codeLimiter = rateLimit;

// Route Handlers
const generateCode = catchAsync(async (req, res) => {
    const { prompt, language,projectId, context } = req.body;
    console.log("project id",projectId);
    logger.info(prompt);
    const result = await codeService.generateCode({
        prompt,
        language,
        projectId,
        userId: req.user._id,
        context
    });
    console.log("Generated Code:", result);

    res.json({
        status: 'success',
        data: result
    });
});

const analyzeCode = catchAsync(async (req, res) => {
    const { code, language } = req.body;
    const analysis = await codeService.analyzeCode({ code, language });
    res.json({
        status: 'success',
        data: { analysis }
    });
});

const optimizeCode = catchAsync(async (req, res) => {
    const { code, language, requirements } = req.body;
    const optimized = await codeService.optimizeCode({
        code,
        language,
        requirements,
        userId: req.user._id
    });
    res.json({
        status: 'success',
        data: { optimized }
    });
});

const saveCodeSnippet = catchAsync(async (req, res) => {

    console.log("in savecodeSnippet");
    const { name, code, language, projectId } = req.body;
    const snippet = await codeService.saveCodeSnippet({
        name,
        code,
        language,
        projectId,
        userId: req.user._id
    });
    console.log("saved");

    res.json({
        status: 'success',
        data: { snippet }
    });
});

const getCodeHistory = catchAsync(async (req, res) => {
    const history = await codeService.getCodeHistory(req.params.snippetId);
    res.json({
        status: 'success',
        data: { history }
    });
});

const getSnippetById = catchAsync(async (req, res) => {
    const snippet = await codeService.getSnippetById(req.params.snippetId);
    res.json({
        status: 'success',
        data: { snippet }
    });
});

const deleteSnippet = catchAsync(async (req, res) => {
    await codeService.deleteSnippet(req.params.snippetId, req.user._id);
    res.json({
        status: 'success',
        message: 'Snippet deleted successfully'
    });
});

// Routes
router.post('/generate', [auth, validation.validateCodeRequest], generateCode);
router.post('/analyze', [auth, validation.validateCodeRequest], analyzeCode);
router.post('/optimize', [auth, validation.validateCodeRequest], optimizeCode);
router.post('/save', [auth, validation.validateCodeSnippet], saveCodeSnippet);
router.get('/history/:snippetId', [auth], getCodeHistory);
router.get('/snippet/:snippetId', [auth], getSnippetById);
router.delete('/snippet/:snippetId', [auth], deleteSnippet);

module.exports = router;