// src/api/routes/cicdRoutes.js
const express = require('express');
const router = express.Router();
const cicdService = require('../services/cicdService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/requestValidator');
const { rateLimit } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Rate limiting for CI/CD operations
const cicdLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100 // limit each IP to 100 requests per hour
});

// Pipeline Routes
router.post('/pipeline/init',
    auth,
    authRole(['admin', 'developer']),
    validateRequest(validation.pipelineInitSchema),
    catchAsync(async (req, res) => {
        const { projectId, config } = req.body;
        const pipeline = await cicdService.initializePipeline({
            projectId,
            config,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { pipeline }
        });
    })
);

router.get('/pipeline/:projectId',
    auth,
    validateRequest(validation.projectIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const config = await cicdService.getPipelineConfig(
            req.params.projectId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { config }
        });
    })
);

router.put('/pipeline/:projectId',
    auth,
    authRole(['admin', 'developer']),
    validateRequest(validation.pipelineUpdateSchema),
    catchAsync(async (req, res) => {
        const { config } = req.body;
        const updated = await cicdService.updatePipelineConfig(
            req.params.projectId,
            config,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { pipeline: updated }
        });
    })
);

// Build Routes
router.post('/build',
    auth,
    cicdLimiter,
    validateRequest(validation.buildInitSchema),
    catchAsync(async (req, res) => {
        const { projectId, branch = 'main', config } = req.body;
        const build = await cicdService.triggerBuild({
            projectId,
            branch,
            config,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { build }
        });
    })
);

router.get('/build/:buildId',
    auth,
    validateRequest(validation.buildIdSchema, 'params'),
    catchAsync(async (req, res) => {
        const status = await cicdService.getBuildStatus(
            req.params.buildId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { buildStatus: status }
        });
    })
);

router.get('/builds/:projectId',
    auth,
    validateRequest(validation.projectIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const builds = await cicdService.getProjectBuilds(
            req.params.projectId,
            req.user._id,
            { page, limit }
        );
        res.json({
            status: 'success',
            data: { builds }
        });
    })
);

// Deployment Routes
router.post('/deploy',
    auth,
    authRole(['admin', 'developer']),
    validateRequest(validation.deploymentSchema),
    catchAsync(async (req, res) => {
        const { projectId, environment, version, config } = req.body;
        const deployment = await cicdService.deploy({
            projectId,
            environment,
            version,
            config,
            userId: req.user._id
        });
        res.json({
            status: 'success',
            data: { deployment }
        });
    })
);

router.get('/deploy/:deploymentId',
    auth,
    validateRequest(validation.deploymentIdSchema, 'params'),
    catchAsync(async (req, res) => {
        const status = await cicdService.getDeploymentStatus(
            req.params.deploymentId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { deploymentStatus: status }
        });
    })
);

router.get('/deployments/:projectId',
    auth,
    validateRequest(validation.projectIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const { page = 1, limit = 10, environment } = req.query;
        const deployments = await cicdService.getProjectDeployments(
            req.params.projectId,
            req.user._id,
            { page, limit, environment }
        );
        res.json({
            status: 'success',
            data: { deployments }
        });
    })
);

// Pipeline Metrics
router.get('/metrics/:projectId',
    auth,
    validateRequest(validation.projectIdSchema, 'params'),
    cache(300),
    catchAsync(async (req, res) => {
        const metrics = await cicdService.getPipelineMetrics(
            req.params.projectId,
            req.user._id
        );
        res.json({
            status: 'success',
            data: { metrics }
        });
    })
);

module.exports = router;