const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { authenticate } = require('../middleware/auth');

// 1. Create a task (Admin or Workspace Members)
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, priority, workspace, assignedTo } = req.body;

        if (!title || !workspace) {
            return res.status(400).json({ message: 'Task title and workspace ID are required.' });
        }

        const ws = await Workspace.findById(workspace);
        if (!ws) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        const isMember = ws.members.some((m) => m.toString() === req.user.id);
        if (ws.owner.toString() !== req.user.id && !isMember && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied to this workspace.' });
        }

        const task = await Task.create({
            title,
            description,
            priority: priority || 'Medium',
            workspace,
            assignedTo: assignedTo || null,
            createdBy: req.user.id
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        return res.status(201).json({
            message: 'Task created successfully.',
            task: populatedTask
        });
    } catch (error) {
        console.error('Create task error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 2. Fetch all tasks for a workspace
router.get('/workspace/:workspaceId', authenticate, async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const ws = await Workspace.findById(workspaceId);
        if (!ws) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        const isMember = ws.members.some((m) => m.toString() === req.user.id);
        if (ws.owner.toString() !== req.user.id && !isMember && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied to this workspace.' });
        }

        const tasks = await Task.find({ workspace: workspaceId })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        return res.json({ tasks });
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 3. Edit task details (Admin or Workspace Owner ONLY)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, description, priority, assignedTo } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const ws = await Workspace.findById(task.workspace);
        const isOwner = ws && ws.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied: Only Admins or Workspace Owners can edit task details.' });
        }

        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority) task.priority = priority;
        task.assignedTo = assignedTo || null;

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        return res.json({
            message: 'Task updated successfully.',
            task: populatedTask
        });
    } catch (error) {
        console.error('Edit task error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 4. Update task status (Employees and Admins can Drag & Drop)
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['To Do', 'In Progress', 'Completed'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        task.status = status;
        await task.save();

        return res.json({ message: 'Status updated successfully.', task });
    } catch (error) {
        console.error('Status update error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 5. Delete task (Admin or Workspace Owner ONLY)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const ws = await Workspace.findById(task.workspace);
        const isOwner = ws && ws.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied: Only Admins or Workspace Owners can delete tasks.' });
        }

        await Task.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Task deleted successfully.', taskId: req.params.id });
    } catch (error) {
        console.error('Delete task error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;