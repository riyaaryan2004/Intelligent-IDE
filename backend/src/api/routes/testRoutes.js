// src/api/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const testService = require('../services/testService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const rateLimit = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Route handlers
const generateTests = async (req, res) => {
    const { code, language, coverage = 80 } = req.body;
    const tests = await testService.generateTests({
        code,
        language,
        coverage,
        userId: req.user._id
    });
    res.json({
        status: 'success',
        data: { tests }
    });
};

const runTests = async (req, res) => {
    const { code, tests, language } = req.body;
    const results = await testService.runTests({
        code,
        tests,
        language,
        userId: req.user._id
    });
    res.json({
        status: 'success',
        data: { results }
    });
};

const saveTestCase = async (req, res) => {
    const { name, testCode, type, codeSnippetId } = req.body;
    const testCase = await testService.saveTestCase({
        name,
        testCode,
        type,
        codeSnippetId,
        userId: req.user._id
    });
    res.json({
        status: 'success',
        data: { testCase }
    });
};

const getTestHistory = async (req, res) => {
    const history = await testService.getTestHistory(
        req.params.snippetId,
        req.user._id
    );
    res.json({
        status: 'success',
        data: { history }
    });
};

const getTestCoverage = async (req, res) => {
    const coverage = await testService.getTestCoverage(
        req.params.snippetId,
        req.user._id
    );
    res.json({
        status: 'success',
        data: { coverage }
    });
};

const getTestCases = async (req, res) => {
    const testCases = await testService.getTestCases(
        req.params.snippetId,
        req.user._id
    );
    res.json({
        status: 'success',
        data: { testCases }
    });
};

const updateTestCase = async (req, res) => {
    const { name, testCode, type } = req.body;
    const updatedTest = await testService.updateTestCase(
        req.params.testId,
        { name, testCode, type },
        req.user._id
    );
    res.json({
        status: 'success',
        data: { testCase: updatedTest }
    });
};

const deleteTestCase = async (req, res) => {
    await testService.deleteTestCase(req.params.testId, req.user._id);
    res.json({
        status: 'success',
        message: 'Test case deleted successfully'
    });
};

// Rate limiter middleware
const testGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
});

// Routes
router.post('/generate', [
    auth,
    testGenerationLimiter,
    validation.validateTestCase(),
    catchAsync(generateTests)
]);

router.post('/run', [
    auth,
    validation.validateTestCase()
], catchAsync(runTests));


router.post('/save', [
    auth,
    validation.validateTestCase()
], catchAsync(saveTestCase));

router.get('/history/:snippetId', [
    auth,
    validation.validateTestCase(),
    cache(300)
], catchAsync(getTestHistory));

router.get('/coverage/:snippetId', [
    auth,
    validation.validateTestCase(),
    cache(300)
], catchAsync(getTestCoverage));

router.get('/cases/:snippetId', [
    auth,
    validation.validateTestCase(),
    cache(300)
], catchAsync(getTestCases));

router.put('/case/:testId', [
    auth,
    validation.validateTestCase()
], catchAsync(updateTestCase));

router.delete('/case/:testId', [
    auth,
    validation.validateTestCase()
], catchAsync(deleteTestCase));

module.exports = router;