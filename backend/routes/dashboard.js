const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — get dashboard stats for current user
router.get('/', auth, async (req, res) => {
  try {
    // Get user's projects
    const projects = await Project.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id }
      ]
    });

    const projectIds = projects.map(p => p._id);

    // Get all tasks across user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    // Total tasks
    const totalTasks = allTasks.length;

    // Tasks by status
    const tasksByStatus = {
      'To Do': allTasks.filter(t => t.status === 'To Do').length,
      'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
      'Done': allTasks.filter(t => t.status === 'Done').length
    };

    // Overdue tasks (past due date & not done)
    const now = new Date();
    const overdueTasks = allTasks.filter(
      t => new Date(t.dueDate) < now && t.status !== 'Done'
    ).length;

    // Tasks per user
    const tasksByUser = {};
    allTasks.forEach(t => {
      if (t.assignedTo) {
        const name = t.assignedTo.name;
        tasksByUser[name] = (tasksByUser[name] || 0) + 1;
      }
    });

    // Recent tasks (last 5)
    const recentTasks = allTasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      totalTasks,
      tasksByStatus,
      overdueTasks,
      tasksByUser,
      totalProjects: projects.length,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
