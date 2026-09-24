const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// 1. Create Workspace (Admin only)
router.post('/', authenticate, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Workspace name is required.' });
        }

        const workspace = await Workspace.create({
            name,
            description,
            owner: req.user.id,
            members: [req.user.id]
        });

        const populatedWorkspace = await Workspace.findById(workspace._id)
            .populate('owner', 'name email')
            .populate('members', 'name email role');

        return res.status(201).json({
            message: 'Workspace created successfully.',
            workspace: populatedWorkspace
        });
    } catch (error) {
        console.error('Create workspace error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 2. Fetch all workspaces available to user
router.get('/', authenticate, async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        })
            .populate('owner', 'name email')
            .populate('members', 'name email role');

        return res.json({ workspaces });
    } catch (error) {
        console.error('Fetch workspaces error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// 3. Invite registered employee to workspace
router.post('/:id/members', authenticate, async (req, res) => {
    try {
        const { email } = req.body;
        const workspaceId = req.params.id;

        if (!email) {
            return res.status(400).json({ message: 'Employee corporate email is required.' });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // Must be Owner or Admin to invite
        const isOwner = workspace.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only workspace owners or admins can invite members.' });
        }

        const userToAdd = await User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            return res.status(404).json({ message: 'No registered employee found with this email.' });
        }

        const isMember = workspace.members.some(
            (m) => m.toString() === userToAdd._id.toString()
        );
        if (isMember) {
            return res.status(400).json({ message: 'Employee is already a member of this workspace.' });
        }

        workspace.members.push(userToAdd._id);
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspaceId)
            .populate('owner', 'name email')
            .populate('members', 'name email role');

        return res.json({
            message: 'Employee added to workspace successfully.',
            workspace: updatedWorkspace
        });
    } catch (error) {
        console.error('Invite member error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;