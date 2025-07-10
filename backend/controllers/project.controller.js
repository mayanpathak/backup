import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name } = req.body || {};
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Project name cannot be empty' });
        }

        // Validate user authentication
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        
        if (!loggedInUser || !loggedInUser._id) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ 
            name: name.trim(), 
            userId 
        });

        if (!newProject) {
            return res.status(500).json({ error: 'Failed to create project' });
        }

        return res.status(201).json(newProject);

    } catch (err) {
        console.error('Error creating project:', {
            error: err.message,
            stack: err.stack,
            user: req.user?.email
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to create project' });
        }
    }
};

export const getAllProject = async (req, res) => {
    try {
        // Validate user authentication
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'User authentication required' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser || !loggedInUser._id) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        });

        // Ensure we return an array
        const projects = Array.isArray(allUserProjects) ? allUserProjects : [];

        return res.status(200).json({
            projects: projects
        });

    } catch (err) {
        console.error('Error getting projects:', {
            error: err.message,
            stack: err.stack,
            user: req.user?.email
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to retrieve projects' });
        }
    }
};

export const addUserToProject = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { projectId, users } = req.body || {};

        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            return res.status(400).json({ error: "Project ID is required" });
        }

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: "At least one user is required" });
        }

        // Validate user authentication
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'User authentication required' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser || !loggedInUser._id) {
            return res.status(404).json({ error: "User not found" });
        }

        const project = await projectService.addUsersToProject({
            projectId: projectId.trim(),
            users,
            userId: loggedInUser._id
        });

        if (!project) {
            return res.status(500).json({ error: 'Failed to add users to project' });
        }

        return res.status(200).json({
            project
        });

    } catch (err) {
        console.error('Error adding users to project:', {
            error: err.message,
            stack: err.stack,
            projectId: req.body?.projectId,
            user: req.user?.email
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to add users to project' });
        }
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params || {};

        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const project = await projectService.getProjectById({ 
            projectId: projectId.trim() 
        });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        return res.status(200).json({
            project
        });

    } catch (err) {
        console.error('Error getting project by ID:', {
            error: err.message,
            stack: err.stack,
            projectId: req.params?.projectId
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to retrieve project' });
        }
    }
};

export const updateFileTree = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId, fileTree } = req.body || {};

        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            return res.status(400).json({ error: "Project ID is required" });
        }

        if (fileTree === undefined || fileTree === null) {
            return res.status(400).json({ error: "File tree is required" });
        }

        const project = await projectService.updateFileTree({
            projectId: projectId.trim(),
            fileTree
        });

        if (!project) {
            return res.status(500).json({ error: 'Failed to update file tree' });
        }

        return res.status(200).json({
            project
        });

    } catch (err) {
        console.error('Error updating file tree:', {
            error: err.message,
            stack: err.stack,
            projectId: req.body?.projectId
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to update file tree' });
        }
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params || {};

        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            return res.status(400).json({ error: "Project ID is required" });
        }

        // Validate user authentication
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'User authentication required' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser || !loggedInUser._id) {
            return res.status(404).json({ error: "User not found" });
        }

        const deletedProject = await projectService.deleteProject({
            projectId: projectId.trim(),
            userId: loggedInUser._id
        });

        if (!deletedProject) {
            return res.status(500).json({ error: 'Failed to delete project' });
        }

        return res.status(200).json({
            message: "Project deleted successfully",
            project: deletedProject
        });

    } catch (err) {
        console.error('Error deleting project:', {
            error: err.message,
            stack: err.stack,
            projectId: req.params?.projectId,
            user: req.user?.email
        });
        
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to delete project' });
        }
    }
};