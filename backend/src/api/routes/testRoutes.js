// src/api/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const testService = require('../services/testService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/requestValidator');
const { rateLimit } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Rate limit for test generation
const testGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // limit each IP to 50 requests per windowMs
});

router.post('/generate',
    auth,
    testGenerationLimiter,
    validateRequest(validation.testGenerationSchema),
    catchAsync(async (req, res) => {
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
    })
);

router.post('/run',
    auth,
    validateRequest(validation.testRunSchema),
    catchAsync(async (req, res) => {
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
    })
);

router.post('/save',
    auth,
    validateRequest(validation.testCaseSchema),
    catchAsync(async (req, res) => {
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
    })
);

router.get('/history/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    cache(300), // Cache for 5 minutes
    catchAsync(async (req, res) => {
        const history = await testService.getTestHistory(
            req.params.snippetId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { history }
        });
    })
);

router.get('/coverage/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const coverage = await testService.getTestCoverage(
            req.params.snippetId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { coverage }
        });
    })
);

router.get('/cases/:snippetId',
    auth,
    validateRequest(validation.snippetIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const testCases = await testService.getTestCases(
            req.params.snippetId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { testCases }
        });
    })
);

router.put('/case/:testId',
    auth,
    validateRequest(validation.testUpdateSchema),
    catchAsync(async (req, res) => {
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
    })
);

router.delete('/case/:testId',
    auth,
    validateRequest(validation.testIdSchema, 'params'),
    catchAsync(async (req, res) => {
        await testService.deleteTestCase(req.params.testId, req.user._id);
        res.json({
            status: 'success',
            message: 'Test case deleted successfully'
        });
    })
);

module.exports = router;