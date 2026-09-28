const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { authenticate } = require('../middleware/auth');

// 1. Get all tasks for a workspace
router.get('/workspace/:workspaceId', authenticate, async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        const isMember = workspace.members.some(m => m.toString() === req.user.id);
        const isOwner = workspace.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isMember && !isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied to this workspace.' });
        }

        const tasks = await Task.find({ workspace: workspaceId })
            .populate('assignedTo', 'name email role')
            .populate('createdBy', 'name email');

        res.json({ tasks });
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({ message: 'Failed to retrieve workspace tasks.' });
    }
});

// 2. Create Task or Log Daily Work
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, priority, assignedTo, workspace, status } = req.body;

        if (!title || !workspace) {
            return res.status(400).json({ message: 'Title and workspace ID are required.' });
        }

        const targetWorkspace = await Workspace.findById(workspace);
        if (!targetWorkspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        const validAssignee = assignedTo && assignedTo.trim() !== '' ? assignedTo : null;

        const newTask = await Task.create({
            title,
            description,
            priority: priority || 'Medium',
            assignedTo: validAssignee,
            workspace,
            createdBy: req.user.id,
            status: status || 'To Do'
        });

        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email role');

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Task creation error:', error);
        res.status(500).json({ message: 'Failed to create task.' });
    }
});

// 3. Update Task Status (Drag and Drop)
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['To Do', 'In Progress', 'Completed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid task status.' });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        res.json(task);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update task status.' });
    }
});

// 4. Update Task Details (Admin or Workspace Owner Only)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, description, priority, assignedTo } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const workspace = await Workspace.findById(task.workspace);
        const isOwner = workspace && workspace.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only Admins or Workspace Owners can edit task details.' });
        }

        const validAssignee = assignedTo && assignedTo.trim() !== '' ? assignedTo : null;

        task.title = title || task.title;
        task.description = description !== undefined ? description : task.description;
        task.priority = priority || task.priority;
        task.assignedTo = validAssignee;

        await task.save();

        const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');
        res.json(updatedTask);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Failed to edit task.' });
    }
});

// 5. Delete Task (Admin or Workspace Owner Only)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const workspace = await Workspace.findById(task.workspace);
        const isOwner = workspace && workspace.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only Admins or Workspace Owners can delete tasks.' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Failed to delete task.' });
    }
});

module.exports = router;