const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/projects/:projectId/tasks — get all tasks for a project
router.get('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check membership
    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    const isAdmin = project.admin.toString() === req.user._id.toString();
    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects/:projectId/tasks — create a task (admin only)
router.post('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only admin can create tasks
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can create tasks.' });
    }

    const { title, description, dueDate, priority, assignedTo } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required.' });
    }

    // If assigning, verify user is a member
    if (assignedTo) {
      const isMember = project.members.some(m => m.toString() === assignedTo);
      if (!isMember) {
        return res.status(400).json({ message: 'Can only assign tasks to project members.' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      dueDate,
      priority: priority || 'Medium',
      status: 'To Do',
      project: project._id,
      assignedTo: assignedTo || null,
      createdBy: req.user._id
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/tasks/:id — update a task
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isAdmin = project.admin.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Members can only update status of their assigned tasks
    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Members can only update status
    if (!isAdmin && isAssigned) {
      const allowedFields = ['status'];
      const updateKeys = Object.keys(req.body);
      const isValidUpdate = updateKeys.every(key => allowedFields.includes(key));
      if (!isValidUpdate) {
        return res.status(403).json({ message: 'Members can only update task status.' });
      }
    }

    const { title, description, dueDate, priority, status, assignedTo } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete tasks.' });
    }

    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
