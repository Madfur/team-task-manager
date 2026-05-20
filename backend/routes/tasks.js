const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Helper: check if user is member of a project
async function isMember(userId, projectId) {
  const m = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return m;
}

// GET /api/tasks/project/:projectId - Get all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const member = await isMember(req.user.id, projectId);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    // Auto-mark overdue tasks
    await prisma.task.updateMany({
      where: {
        projectId,
        status: { notIn: ['DONE', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks/project/:projectId - Create a task
router.post(
  '/project/:projectId',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('assignedToId').optional().isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const projectId = parseInt(req.params.projectId);
      const member = await isMember(req.user.id, projectId);
      if (!member) return res.status(403).json({ error: 'Access denied' });

      const { title, description, priority, dueDate, assignedToId } = req.body;

      // If assigning, verify assignee is also a project member
      if (assignedToId) {
        const assigneeMember = await isMember(parseInt(assignedToId), projectId);
        if (!assigneeMember) return res.status(400).json({ error: 'Assignee is not a project member' });
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          assignedToId: assignedToId ? parseInt(assignedToId) : null,
          createdById: req.user.id,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/tasks/:id - Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await isMember(req.user.id, task.projectId);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const isAdminMember = member.projectRole === 'ADMIN' || req.user.role === 'ADMIN';

    // Members can only update status of tasks assigned to them
    if (!isAdminMember && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own assigned tasks' });
    }

    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    // Only admins can reassign tasks
    const updateData = {};
    if (status) updateData.status = status;
    if (isAdminMember) {
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId ? parseInt(assignedToId) : null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await isMember(req.user.id, task.projectId);
    const isAdminMember = member?.projectRole === 'ADMIN' || req.user.role === 'ADMIN';
    if (!isAdminMember) return res.status(403).json({ error: 'Admin access required' });

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
