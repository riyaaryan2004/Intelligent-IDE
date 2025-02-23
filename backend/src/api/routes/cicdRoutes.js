// src/api/routes/cicdRoutes.js
const express = require('express');
const router = express.Router();
const cicdService = require('../services/cicdService');
const validation = require('../middleware/validation');

// Initialize pipeline
router.post('/pipeline/init', validation.validatePipeline, async (req, res) => {
    try {
        const { projectId, config } = req.body;
        const pipeline = await cicdService.initializePipeline({
            projectId,
            config,
            userId: req.user._id
        });
        res.json(pipeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger build
router.post('/build', async (req, res) => {
    try {
        const { projectId, branch } = req.body;
        const build = await cicdService.triggerBuild({
            projectId,
            branch,
            userId: req.user._id
        });
        res.json(build);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get build status
router.get('/build/:buildId', async (req, res) => {
    try {
        const status = await cicdService.getBuildStatus(req.params.buildId);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deploy application
router.post('/deploy', validation.validateDeployment, async (req, res) => {
    try {
        const { projectId, environment, version } = req.body;
        const deployment = await cicdService.deploy({
            projectId,
            environment,
            version,
            userId: req.user._id
        });
        res.json(deployment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deployment status
router.get('/deploy/:deploymentId', async (req, res) => {
    try {
        const status = await cicdService.getDeploymentStatus(req.params.deploymentId);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pipeline configuration
router.get('/pipeline/:projectId', async (req, res) => {
    try {
        const config = await cicdService.getPipelineConfig(req.params.projectId);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update pipeline configuration
router.put('/pipeline/:projectId', validation.validatePipeline, async (req, res) => {
    try {
        const { config } = req.body;
        const updated = await cicdService.updatePipelineConfig(req.params.projectId, config);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;