// src/api/services/cicdService.js

const Project = require('../../models/Project');
const logger = require('../../utils/logger');
const { APIError } = require('../middleware/errorHandler');
const geminiService = require('./geminiService');

class CICDService {
    constructor() {
        this.activePipelines = new Map();
        this.buildQueue = [];
        this.deploymentQueue = [];
    }

    async initializePipeline(params) {
        const { projectId, config, userId } = params;

        try {
            // Verify project exists and user has access
            const project = await Project.findOne({ _id: projectId, owner: userId });
            if (!project) {
                throw new APIError('Project not found or access denied', 404);
            }

            // Validate pipeline configuration
            this.validatePipelineConfig(config);

            // Create pipeline configuration
            const pipeline = {
                id: `pipeline-${projectId}-${Date.now()}`,
                projectId,
                config,
                status: 'initialized',
                stages: this.initializeStages(config.stages),
                history: [],
                metrics: {
                    totalBuilds: 0,
                    successfulBuilds: 0,
                    failedBuilds: 0,
                    averageBuildTime: 0
                }
            };

            // Store pipeline
            this.activePipelines.set(pipeline.id, pipeline);

            // Update project with pipeline reference
            await Project.findByIdAndUpdate(projectId, {
                $set: { 'settings.pipelineId': pipeline.id }
            });

            return pipeline;
        } catch (error) {
            logger.error('Error initializing pipeline:', error);
            throw error;
        }
    }

    validatePipelineConfig(config) {
        const requiredStages = ['build', 'test'];
        const { stages } = config;

        if (!stages || !Array.isArray(stages)) {
            throw new APIError('Pipeline must have stages array', 400);
        }

        // Check for required stages
        const stageNames = stages.map(s => s.name.toLowerCase());
        for (const required of requiredStages) {
            if (!stageNames.includes(required)) {
                throw new APIError(`Pipeline must include ${required} stage`, 400);
            }
        }

        // Validate each stage
        stages.forEach(stage => {
            if (!stage.name || !stage.steps || !Array.isArray(stage.steps)) {
                throw new APIError('Each stage must have name and steps array', 400);
            }
        });
    }

    initializeStages(stages) {
        return stages.map(stage => ({
            ...stage,
            status: 'pending',
            startTime: null,
            endTime: null,
            logs: [],
            artifacts: []
        }));
    }

    async triggerBuild(params) {
        const { projectId, branch = 'main', userId } = params;

        try {
            const project = await Project.findOne({ _id: projectId, owner: userId });
            if (!project) {
                throw new APIError('Project not found or access denied', 404);
            }

            const pipelineId = project.settings?.pipelineId;
            if (!pipelineId || !this.activePipelines.has(pipelineId)) {
                throw new APIError('No active pipeline found for project', 404);
            }

            const buildId = `build-${projectId}-${Date.now()}`;
            const build = {
                id: buildId,
                pipelineId,
                projectId,
                branch,
                status: 'queued',
                stages: [],
                startTime: new Date(),
                endTime: null,
                logs: [],
                artifacts: []
            };

            // Add to build queue
            this.buildQueue.push(build);

            // Start build process
            this.processBuildQueue();

            return build;
        } catch (error) {
            logger.error('Error triggering build:', error);
            throw error;
        }
    }

    async processBuildQueue() {
        if (this.buildQueue.length === 0) return;

        const build = this.buildQueue[0];
        try {
            build.status = 'in_progress';
            
            const pipeline = this.activePipelines.get(build.pipelineId);
            const stages = [...pipeline.stages];

            for (const stage of stages) {
                const stageResult = await this.executeStage(stage, build);
                build.stages.push(stageResult);

                if (stageResult.status === 'failed') {
                    build.status = 'failed';
                    break;
                }
            }

            if (build.status !== 'failed') {
                build.status = 'success';
            }

            build.endTime = new Date();
            this.updatePipelineMetrics(pipeline, build);

        } catch (error) {
            build.status = 'failed';
            build.error = error.message;
            logger.error('Build failed:', error);
        } finally {
            this.buildQueue.shift();
            if (this.buildQueue.length > 0) {
                this.processBuildQueue();
            }
        }
    }

    async executeStage(stage, build) {
        const stageExecution = {
            name: stage.name,
            status: 'in_progress',
            startTime: new Date(),
            endTime: null,
            logs: [],
            artifacts: []
        };

        try {
            for (const step of stage.steps) {
                const stepResult = await this.executeStep(step, build);
                stageExecution.logs.push(...stepResult.logs);
                if (stepResult.artifacts) {
                    stageExecution.artifacts.push(...stepResult.artifacts);
                }
                if (!stepResult.success) {
                    throw new Error(`Step ${step.name} failed`);
                }
            }

            stageExecution.status = 'success';
        } catch (error) {
            stageExecution.status = 'failed';
            stageExecution.error = error.message;
        }

        stageExecution.endTime = new Date();
        return stageExecution;
    }

    async executeStep(step, build) {
        // This would integrate with actual build tools
        // This is a simplified implementation
        const logs = [];
        const artifacts = [];

        switch (step.type) {
            case 'build':
                logs.push(`Building project ${build.projectId}`);
                // Simulate build process
                await new Promise(resolve => setTimeout(resolve, 2000));
                break;

            case 'test':
                logs.push(`Running tests for project ${build.projectId}`);
                // Simulate test process
                await new Promise(resolve => setTimeout(resolve, 1500));
                break;

            case 'deploy':
                logs.push(`Deploying project ${build.projectId}`);
                // Simulate deployment
                await new Promise(resolve => setTimeout(resolve, 3000));
                break;

            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }

        return {
            success: true,
            logs,
            artifacts
        };
    }

    updatePipelineMetrics(pipeline, build) {
        pipeline.metrics.totalBuilds++;
        if (build.status === 'success') {
            pipeline.metrics.successfulBuilds++;
        } else {
            pipeline.metrics.failedBuilds++;
        }

        const buildTime = build.endTime - build.startTime;
        pipeline.metrics.averageBuildTime = 
            (pipeline.metrics.averageBuildTime * (pipeline.metrics.totalBuilds - 1) + buildTime) 
            / pipeline.metrics.totalBuilds;

        pipeline.history.unshift({
            buildId: build.id,
            status: build.status,
            timestamp: build.endTime,
            duration: buildTime
        });

        // Keep only last 50 builds in history
        if (pipeline.history.length > 50) {
            pipeline.history.pop();
        }
    }

    async getBuildStatus(buildId) {
        const build = this.buildQueue.find(b => b.id === buildId);
        if (!build) {
            throw new APIError('Build not found', 404);
        }
        return build;
    }

    async getPipelineConfig(projectId) {
        const project = await Project.findById(projectId);
        if (!project || !project.settings?.pipelineId) {
            throw new APIError('Pipeline not found', 404);
        }

        const pipeline = this.activePipelines.get(project.settings.pipelineId);
        if (!pipeline) {
            throw new APIError('Pipeline not found', 404);
        }

        return pipeline;
    }

    async updatePipelineConfig(projectId, config) {
        const project = await Project.findById(projectId);
        if (!project || !project.settings?.pipelineId) {
            throw new APIError('Pipeline not found', 404);
        }

        const pipeline = this.activePipelines.get(project.settings.pipelineId);
        if (!pipeline) {
            throw new APIError('Pipeline not found', 404);
        }

        // Validate new configuration
        this.validatePipelineConfig(config);

        // Update pipeline configuration
        pipeline.config = config;
        pipeline.stages = this.initializeStages(config.stages);

        return pipeline;
    }
}

module.exports = new CICDService();