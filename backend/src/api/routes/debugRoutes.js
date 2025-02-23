// src/api/routes/debugRoutes.js
const express = require('express');
const router = express.Router();
const debugService = require('../services/debugService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/requestValidator');
const { rateLimit } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Rate limit for debug analysis
const debugAnalysisLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

router.post('/analyze',
    auth,
    debugAnalysisLimiter,
    validateRequest(validation.debugAnalysisSchema),
    catchAsync(async (req, res) => {
        const { code, language } = req.body;
        const analysis = await debugService.analyzeCode({
            code,
            language,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { analysis }
        });
    })
);

router.post('/fix',
    auth,
    validateRequest(validation.bugFixSchema),
    catchAsync(async (req, res) => {
        const { code, language, error } = req.body;
        const fixes = await debugService.suggestFixes({
            code,
            language,
            error,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { fixes }
        });
    })
);

router.post('/session',
    auth,
    validateRequest(validation.debugSessionSchema),
    catchAsync(async (req, res) => {
        const { code, language, breakpoints } = req.body;
        const session = await debugService.startDebugSession({
            code,
            language,
            breakpoints,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { session }
        });
    })
);

router.post('/state',
    auth,
    validateRequest(validation.debugStateSchema),
    catchAsync(async (req, res) => {
        const { sessionId, lineNumber } = req.body;
        const state = await debugService.getVariableState(
            sessionId,
            lineNumber,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { state }
        });
    })
);

router.delete('/session/:sessionId',
    auth,
    validateRequest(validation.sessionIdSchema, 'params'),
    catchAsync(async (req, res) => {
        await debugService.endDebugSession(req.params.sessionId, req.user._id);
        res.json({
            status: 'success',
            message: 'Debug session ended successfully'
        });
    })
);

// Get debug session history
router.get('/sessions',
    auth,
    cache(300),
    catchAsync(async (req, res) => {
        const sessions = await debugService.getDebugSessions(req.user._id);
        res.json({
            status: 'success',
            data: { sessions }
        });
    })
);

// Get specific debug session details
router.get('/session/:sessionId',
    auth,
    validateRequest(validation.sessionIdSchema, 'params'),
    cache(60),
    catchAsync(async (req, res) => {
        const session = await debugService.getDebugSession(
            req.params.sessionId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { session }
        });
    })
);

module.exports = router;