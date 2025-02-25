// src/api/services/projectService.js
const Project = require('../../models/Project');
const User = require('../../models/User');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../../utils/logger');

class ProjectService {
    async createProject(data) {
        try {
            const { name, description, language, owner } = data;

            // Check if project with same name exists for user
            const existingProject = await Project.findOne({ name, owner });
            if (existingProject) {
                throw new APIError('Project with this name already exists', 400);
            }

            // Create new project
            const project = await Project.create({
                name,
                description,
                language,
                owner,
                collaborators: [{ user: owner, role: 'owner' }],
                settings: {},
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Add project to user's projects
            await User.findByIdAndUpdate(owner, {
                $push: { projects: project._id }
            });

            return project;
        } catch (error) {
            logger.error('Error creating project:', error);
            throw error;
        }
    }

    async getAllProjects(params) {
        try {
            const { userId, page = 1, limit = 10, search, language, sort } = params;
            // Build query
            const query = {
                $or: [
                    { owner: userId },
                    { 'collaborators.user': userId }
                ]
            };


            // Add search filter
            if (search) {
                query.$or.push(
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                );
            }

            // Add language filter
            if (language) {
                query.language = language;
            }

            // Build sort options
            const sortOptions = {};
            if (sort) {
                const [field, order] = sort.split(':');
                sortOptions[field] = order === 'desc' ? -1 : 1;
            } else {
                sortOptions.createdAt = -1;
            }

            // Execute query with pagination
            const projects = await Project.find(query)
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("owner", "username email")
                .populate("collaborators.user", "username email")
                .lean();
                console.log("Projects after lean():", projects);

            // Get total count
            const total = await Project.countDocuments(query);

            return {
                projects,
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error getting projects:', error);
            throw error;
        }
    }

    async getProjectById(projectId, userId) {
        try {
            const project = await Project.findOne({
                _id: projectId,
                $or: [
                    { owner: userId },
                    { 'collaborators.user': userId }
                ]
            })
                .populate('owner', 'username email')
                .populate('collaborators.user', 'username email')
                .populate('codeSnippets')
                .populate('testCases');

            if (!project) {
                throw new APIError('Project not found or access denied', 404);
            }

            return project;
        } catch (error) {
            logger.error('Error getting project:', error);
            throw error;
        }
    }

    async updateProject(projectId, data, userId) {
        try {
            const { name, description, language, settings } = data;

            // Check project exists and user has access
            const project = await this.getProjectById(projectId, userId);
            console.log("project found");

            // Check if user is owner or admin
            const userRole = project.collaborators?.find(
                c => c?.user?._id?.toString() === userId?.toString()
            )?.role;

            console.log("Project ID:", projectId);
            console.log("User ID:", userId);
            console.log("Collaborators:", project.collaborators);


            if (!['owner', 'admin'].includes(userRole)) {
                throw new APIError('Only owners and admins can update projects', 403);
            }
            console.log("admin found");
            // Update project
            const updatedProject = await Project.findByIdAndUpdate(
                projectId,
                {
                    $set: {
                        name,
                        description,
                        language,
                        settings,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            )
                .populate('owner', 'username email')
                .populate('collaborators.user', 'username email');

            return updatedProject;
        } catch (error) {
            logger.error('Error updating project:', error);
            throw error;
        }
    }

    async deleteProject(projectId, userId) {
        try {
            // Check project exists and user has access
            const project = await this.getProjectById(projectId, userId);

            // Check if user is owner
            if (project.owner._id.toString() !== userId.toString()) {
                throw new APIError('Only project owner can delete projects', 403);
            }

            // Remove project from all users' projects
            await User.updateMany(
                { projects: projectId },
                { $pull: { projects: projectId } }
            );

            // Delete project
            await Project.findByIdAndDelete(projectId);
        } catch (error) {
            logger.error('Error deleting project:', error);
            throw error;
        }
    }

    async getProjectStats(projectId, userId) {
        try {
            const project = await this.getProjectById(projectId, userId);

            return {
                codeSnippetsCount: project.codeSnippets.length,
                testCasesCount: project.testCases.length,
                collaboratorsCount: project.collaborators.length,
                lastUpdated: project.updatedAt,
                language: project.language,
                // Add more stats as needed
            };
        } catch (error) {
            logger.error('Error getting project stats:', error);
            throw error;
        }
    }

    async addCollaborator(projectId, data) {
        try {
            const { email, role, addedBy } = data;

            // Check project exists and user has access
            const project = await this.getProjectById(projectId, addedBy);

            // Check if user is owner or admin
            const userRole = project.collaborators.find(
                c => c.user._id.toString() === addedBy.toString()
            )?.role;

            if (!['owner', 'admin'].includes(userRole)) {
                throw new APIError('Only owners and admins can add collaborators', 403);
            }

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                throw new APIError('User not found', 404);
            }

            // Check if user is already a collaborator
            if (project.collaborators.some(c => c.user._id.toString() === user._id.toString())) {
                throw new APIError('User is already a collaborator', 400);
            }

            // Add collaborator
            project.collaborators.push({ user: user._id, role });
            await project.save();

            // Add project to user's projects
            await User.findByIdAndUpdate(user._id, {
                $push: { projects: projectId }
            });

            return await project.populate('collaborators.user', 'username email');
        } catch (error) {
            logger.error('Error adding collaborator:', error);
            throw error;
        }
    }

    async removeCollaborator(projectId, collaboratorId, userId) {
        try {
            // Check project exists and user has access
            const project = await this.getProjectById(projectId, userId);

            // Check if user is owner or admin
            const userRole = project.collaborators.find(
                c => c.user._id.toString() === userId.toString()
            )?.role;

            if (!['owner', 'admin'].includes(userRole)) {
                throw new APIError('Only owners and admins can remove collaborators', 403);
            }

            // Cannot remove owner
            const collaborator = project.collaborators.find(
                c => c.user._id.toString() === collaboratorId
            );

            if (!collaborator) {
                throw new APIError('Collaborator not found', 404);
            }

            if (collaborator.role === 'owner') {
                throw new APIError('Cannot remove project owner', 400);
            }

            // Remove collaborator
            await Project.findByIdAndUpdate(projectId, {
                $pull: { collaborators: { user: collaboratorId } }
            });

            // Remove project from user's projects
            await User.findByIdAndUpdate(collaboratorId, {
                $pull: { projects: projectId }
            });
        } catch (error) {
            logger.error('Error removing collaborator:', error);
            throw error;
        }
    }

    async getProjectActivity(projectId, params, userId) {
        try {
            const { page = 1, limit = 20 } = params;

            // Check project exists and user has access
            await this.getProjectById(projectId, userId);

            // Get activity from activity log (you'll need to create this model)
            const activities = await ActivityLog.find({ project: projectId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('user', 'username email');

            const total = await ActivityLog.countDocuments({ project: projectId });

            return {
                activities,
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error getting project activity:', error);
            throw error;
        }
    }
}

module.exports = new ProjectService();