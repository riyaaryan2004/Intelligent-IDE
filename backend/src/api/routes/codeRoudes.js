// src/api/routes/codeRoutes.js
const express = require('express');
const router = express.Router();
const codeService = require('../services/codeService');
const validation = require('../middleware/validation');

// Generate code
router.post('/generate', validation.validateCodeRequest, async (req, res) => {
    try {
        const { prompt, language, context } = req.body;
        const result = await codeService.generateCode({
            prompt,
            language,
            context,
            userId: req.user._id
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze code
router.post('/analyze', async (req, res) => {
    try {
        const { code, language } = req.body;
        const analysis = await codeService.analyzeCode(code, language);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Optimize code
router.post('/optimize', async (req, res) => {
    try {
        const { code, language, requirements } = req.body;
        const optimized = await codeService.optimizeCode({
            code,
            language,
            requirements
        });
        res.json(optimized);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save code snippet
router.post('/save', validation.validateCodeSnippet, async (req, res) => {
    try {
        const { name, code, language, projectId } = req.body;
        const snippet = await codeService.saveCodeSnippet({
            name,
            code,
            language,
            projectId,
            userId: req.user._id
        });
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get code history
router.get('/history/:snippetId', async (req, res) => {
    try {
        const history = await codeService.getCodeHistory(req.params.snippetId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;