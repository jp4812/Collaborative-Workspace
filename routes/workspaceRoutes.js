var express = require('express');
var Workspace = require('../models/Workspace');
var authMiddleware = require('../middleware/auth');

var authenticate = authMiddleware.authenticate;
var authorizeRoles = authMiddleware.authorizeRoles;

var router = express.Router();

// 1. Create a workspace (Admin only)
router.post('/', authenticate, authorizeRoles(['Admin']), async function (req, res) {
    try {
        var name = req.body.name;
        var description = req.body.description;

        if (!name) {
            return res.status(400).json({ message: 'Workspace name is required.' });
        }

        var workspace = await Workspace.create({
            name: name,
            description: description,
            owner: req.user.id,
            members: [req.user.id]
        });

        return res.status(201).json({
            message: 'Workspace created successfully',
            workspace: workspace
        });
    } catch (error) {
        console.error('Workspace creation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2. Get workspaces
router.get('/', authenticate, async function (req, res) {
    try {
        var query = {};

        if (req.user.role !== 'Admin') {
            query.members = req.user.id;
        }

        var workspaces = await Workspace.find(query)
            .populate('owner', 'name email role')
            .populate('members', 'name email role');

        return res.json({ workspaces: workspaces });
    } catch (error) {
        console.error('Fetch workspaces error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// THIS LINE IS REQUIRED:
module.exports = router;