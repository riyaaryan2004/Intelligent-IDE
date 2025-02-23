// src/api/routes/debugRoutes.js
const express = require('express');
const router = express.Router();
const debugService = require('../services/debugService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { createRateLimiter } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Configure rate limiter
const debugLimiter = async (req, res) => {
    try {
        const { code, language, debugLevel = 'info' } = req.body;

        // Apply rate limiting
        await createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });

        const debugResult = await debugService.debugCode({
            code,
            language,
            debugLevel,
            userId: req.user._id
        });

        res.json({
            status: 'success',
            data: { debugResult }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Route Handlers
const analyzeCode = catchAsync(async (req, res) => {
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
});

const suggestFixes = catchAsync(async (req, res) => {
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
});

const startDebugSession = catchAsync(async (req, res) => {
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
});

const getVariableState = catchAsync(async (req, res) => {
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
});

const endDebugSession = catchAsync(async (req, res) => {
    await debugService.endDebugSession(req.params.sessionId, req.user._id);
    res.json({
        status: 'success',
        message: 'Debug session ended successfully'
    });
});

const getDebugSessions = catchAsync(async (req, res) => {
    const sessions = await debugService.getDebugSessions(req.user._id);
    res.json({
        status: 'success',
        data: { sessions }
    });
});

// Routes
router.post('/analyze', auth, debugLimiter, validation.validateCodeRequest, analyzeCode);

router.post('/fix', auth, validation.validateCodeRequest, suggestFixes);

router.post('/session', auth, validation.validateCodeRequest, startDebugSession);

router.post('/state', auth, validation.validateCodeRequest, getVariableState);

router.delete('/session/:sessionId', auth, validation.validateCodeRequest, endDebugSession);

router.get('/sessions', auth, cache(300), getDebugSessions);

module.exports = router;