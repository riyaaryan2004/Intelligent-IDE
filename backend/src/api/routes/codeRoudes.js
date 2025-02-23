// src/api/routes/codeRoutes.js
const express = require('express');
const router = express.Router();
const codeService = require('../services/codeService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/requestValidator');
const { rateLimit } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Rate limit for code generation
const generateCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // limit each IP to 50 requests per windowMs
});

router.post('/generate',
    auth,
    generateCodeLimiter,
    validateRequest(validation.codeGenerationSchema),
    catchAsync(async (req, res) => {
        const { prompt, language, context } = req.body;
        const result = await codeService.generateCode({
            prompt,
            language,
            context,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: result
        });
    })
);

router.post('/analyze',
    auth,
    validateRequest(validation.codeAnalysisSchema),
    catchAsync(async (req, res) => {
        const { code, language } = req.body;
        const analysis = await codeService.analyzeCode({ code, language });
        res.json({
            status: 'success',
            data: { analysis }
        });
    })
);

router.post('/optimize',
    auth,
    validateRequest(validation.codeOptimizationSchema),
    catchAsync(async (req, res) => {
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
    })
);

router.post('/save',
    auth,
    validateRequest(validation.codeSnippetSchema),
    catchAsync(async (req, res) => {
        const { name, code, language, projectId } = req.body;
        const snippet = await codeService.saveCodeSnippet({
            name,
            code,
            language,
            projectId,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { snippet }
        });
    })
);

router.get('/history/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    cache(300), // Cache for 5 minutes
    catchAsync(async (req, res) => {
        const history = await codeService.getCodeHistory(req.params.snippetId);
        res.json({
            status: 'success',
            data: { history }
        });
    })
);

router.get('/snippet/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const snippet = await codeService.getSnippetById(req.params.snippetId);
        res.json({
            status: 'success',
            data: { snippet }
        });
    })
);

router.delete('/snippet/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    catchAsync(async (req, res) => {
        await codeService.deleteSnippet(req.params.snippetId, req.user._id);
        res.json({
            status: 'success',
            message: 'Snippet deleted successfully'
        });
    })
);

module.exports = router;