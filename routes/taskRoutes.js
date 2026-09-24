var express = require('express');
var Task = require('../models/Task');
var Workspace = require('../models/Workspace');
var authMiddleware = require('../middleware/auth');

var authenticate = authMiddleware.authenticate;

var router = express.Router();

// 1. Create a task inside a workspace
router.post('/', authenticate, async function (req, res) {
    try {
        var title = req.body.title;
        var description = req.body.description;
        var workspaceId = req.body.workspace;
        var assignedTo = req.body.assignedTo;
        var priority = req.body.priority || 'Medium';

        if (!title || !workspaceId) {
            return res.status(400).json({ message: 'Title and workspace ID are required.' });
        }

        // Verify workspace exists
        var workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        var task = await Task.create({
            title: title,
            description: description,
            workspace: workspaceId,
            assignedTo: assignedTo || null,
            priority: priority,
            createdBy: req.user.id
        });

        return res.status(201).json({
            message: 'Task created successfully',
            task: task
        });
    } catch (error) {
        console.error('Task creation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2. Get all tasks for a specific workspace
router.get('/workspace/:workspaceId', authenticate, async function (req, res) {
    try {
        var workspaceId = req.params.workspaceId;

        var tasks = await Task.find({ workspace: workspaceId })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        return res.json({ tasks: tasks });
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3. Update task status ('To Do', 'In Progress', 'Completed')
router.patch('/:id/status', authenticate, async function (req, res) {
    try {
        var status = req.body.status;
        var allowedStatuses = ['To Do', 'In Progress', 'Completed'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        var task = await Task.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        return res.json({
            message: 'Task status updated',
            task: task
        });
    } catch (error) {
        console.error('Update task status error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;