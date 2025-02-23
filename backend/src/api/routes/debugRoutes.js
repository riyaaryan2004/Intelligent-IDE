// src/api/routes/debugRoutes.js
const express = require('express');
const router = express.Router();
const debugService = require('../services/debugService');

// Debug code
router.post('/analyze', async (req, res) => {
    try {
        const { code, language } = req.body;
        const analysis = await debugService.analyzeCode({
            code,
            language
        });
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fix bugs
router.post('/fix', async (req, res) => {
    try {
        const { code, language, error } = req.body;
        const fixes = await debugService.suggestFixes({
            code,
            language,
            error
        });
        res.json(fixes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Run debug session
router.post('/session', async (req, res) => {
    try {
        const { code, language, breakpoints } = req.body;
        const session = await debugService.startDebugSession({
            code,
            language,
            breakpoints,
            userId: req.user._id
        });
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get variable state
router.post('/state', async (req, res) => {
    try {
        const { sessionId, lineNumber } = req.body;
        const state = await debugService.getVariableState(sessionId, lineNumber);
        res.json(state);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End debug session
router.delete('/session/:sessionId', async (req, res) => {
    try {
        await debugService.endDebugSession(req.params.sessionId);
        res.json({ message: 'Debug session ended successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;