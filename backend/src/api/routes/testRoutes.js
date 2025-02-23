// src/api/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const testService = require('../services/testService');
const validation = require('../middleware/validation');

// Generate tests
router.post('/generate', async (req, res) => {
    try {
        const { code, language, coverage } = req.body;
        const tests = await testService.generateTests({
            code,
            language,
            coverage,
            userId: req.user._id
        });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Run tests
router.post('/run', async (req, res) => {
    try {
        const { code, tests, language } = req.body;
        const results = await testService.runTests({
            code,
            tests,
            language
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save test case
router.post('/save', validation.validateTestCase, async (req, res) => {
    try {
        const { name, testCode, type, codeSnippetId } = req.body;
        const testCase = await testService.saveTestCase({
            name,
            testCode,
            type,
            codeSnippetId,
            userId: req.user._id
        });
        res.json(testCase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get test history
router.get('/history/:snippetId', async (req, res) => {
    try {
        const history = await testService.getTestHistory(req.params.snippetId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get test coverage
router.get('/coverage/:snippetId', async (req, res) => {
    try {
        const coverage = await testService.getTestCoverage(req.params.snippetId);
        res.json(coverage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;