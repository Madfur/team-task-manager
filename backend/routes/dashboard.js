const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard - Summary stats for the current user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-mark overdue tasks across all user's projects
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    await prisma.task.updateMany({
      where: {
        projectId: { in: projectIds },
        status: { notIn: ['DONE', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });

    // Total tasks in all my projects
    const totalTasks = await prisma.task.count({
      where: { projectId: { in: projectIds } },
    });

    // Tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    });

    // Tasks assigned to me
    const myTasks = await prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Overdue tasks in my projects
    const overdueTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds }, status: 'OVERDUE' },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Projects summary
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        tasks: { select: { status: true } },
        members: true,
      },
    });

    const projectSummaries = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      memberCount: p.members.length,
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter((t) => t.status === 'DONE').length,
      overdueCount: p.tasks.filter((t) => t.status === 'OVERDUE').length,
    }));

    const statusMap = {};
    tasksByStatus.forEach((s) => {
      statusMap[s.status] = s._count.status;
    });

    res.json({
      totalTasks,
      totalProjects: projectIds.length,
      statusBreakdown: {
        TODO: statusMap.TODO || 0,
        IN_PROGRESS: statusMap.IN_PROGRESS || 0,
        DONE: statusMap.DONE || 0,
        OVERDUE: statusMap.OVERDUE || 0,
      },
      myTasks,
      overdueTasks,
      projects: projectSummaries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
