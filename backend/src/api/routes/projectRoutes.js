// src/api/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');
const { auth, authRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { createRateLimiter } = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

// Configure rate limiter
const projectLimiter = async (req, res, next) => {
    try {
        // Apply rate limiting
        await createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50 // limit each IP to 50 requests per windowMs
        });

        next();
    } catch (error) {
        res.status(429).json({ status: 'error', message: 'Too many requests, please try again later.' });
    }
};


// Route Handlers
const createProject = catchAsync(async (req, res) => {
    const { name, description, language } = req.body;
    const project = await projectService.createProject({
        name,
        description,
        language,
        owner: req.user._id
    });
    res.status(201).json({
        status: 'success',
        data: { project }
    });
});

const getAllProjects = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search, language, sort } = req.query;
    const projects = await projectService.getAllProjects({
        userId: req.user._id,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        language,
        sort
    });
    res.json({
        status: 'success',
        data: { projects }
    });
});

const getProjectById = catchAsync(async (req, res) => {
    const project = await projectService.getProjectById(
        req.params.projectId,
        req.user._id
    );
    res.json({
        status: 'success',
        data: { project }
    });
});

const updateProject = catchAsync(async (req, res) => {
    const { name, description, language, settings } = req.body;
    const project = await projectService.updateProject(
        req.params.projectId,
        {
            name,
            description,
            language,
            settings
        },
        req.user._id
    );
    res.json({
        status: 'success',
        data: { project }
    });
});

const deleteProject = catchAsync(async (req, res) => {
    await projectService.deleteProject(req.params.projectId, req.user._id);
    res.json({
        status: 'success',
        message: 'Project deleted successfully'
    });
});

const getProjectStats = catchAsync(async (req, res) => {
    const stats = await projectService.getProjectStats(
        req.params.projectId,
        req.user._id
    );
    res.json({
        status: 'success',
        data: { stats }
    });
});

const addCollaborator = catchAsync(async (req, res) => {
    const { email, role } = req.body;
    const project = await projectService.addCollaborator(
        req.params.projectId,
        {
            email,
            role,
            addedBy: req.user._id
        }
    );
    res.json({
        status: 'success',
        data: { project }
    });
});

const removeCollaborator = catchAsync(async (req, res) => {
    const { collaboratorId } = req.params;
    await projectService.removeCollaborator(
        req.params.projectId,
        collaboratorId,
        req.user._id
    );
    res.json({
        status: 'success',
        message: 'Collaborator removed successfully'
    });
});

const getProjectActivity = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const activity = await projectService.getProjectActivity(
        req.params.projectId,
        {
            page: parseInt(page),
            limit: parseInt(limit)
        },
        req.user._id
    );
    res.json({
        status: 'success',
        data: { activity }
    });
});

// Routes
router.post(
    '/',
    auth,
    projectLimiter,
    validation.validateProjectCreate,
    createProject
);

router.get(
    '/',
    auth,
    cache(300),
    getAllProjects
);

router.get(
    '/:projectId',
    auth,
    validation.validateProjectId,
    cache(300),
    getProjectById
);

router.put(
    '/:projectId',
    auth,
    validation.validateProjectUpdate,
    updateProject
);

router.delete(
    '/:projectId',
    auth,
    validation.validateProjectId,
    deleteProject
);

router.get(
    '/:projectId/stats',
    auth,
    validation.validateProjectId,
    cache(300),
    getProjectStats
);

router.post(
    '/:projectId/collaborators',
    auth,
    authRole(['admin', 'owner']),
    validation.validateCollaborator,
    addCollaborator
);

router.delete(
    '/:projectId/collaborators/:collaboratorId',
    auth,
    authRole(['admin', 'owner']),
    validation.validateProjectId,
    removeCollaborator
);

router.get(
    '/:projectId/activity',
    auth,
    validation.validateProjectId,
    cache(300),
    getProjectActivity
);

module.exports = router;