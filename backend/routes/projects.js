const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('admin', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects — create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      admin: req.user._id,
      members: [req.user._id] // admin is also a member
    });

    const populated = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check if user is admin or member
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isAdmin = project.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects/:id/members — add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check admin
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members.' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Member email is required.' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with that email.' });
    }

    // Check if already a member
    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove members.' });
    }

    // Cannot remove admin
    if (req.params.userId === project.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove the admin from the project.' });
    }

    project.members = project.members.filter(
      m => m.toString() !== req.params.userId
    );
    await project.save();

    // Also unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignedTo: req.params.userId },
      { assignedTo: null }
    );

    const populated = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id — delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete the project.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
