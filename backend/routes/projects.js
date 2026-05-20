const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const prisma = new PrismaClient();

// GET /api/projects - Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            tasks: true,
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.projectRole,
      taskCount: m.project.tasks.length,
      memberCount: m.project.members.length,
    }));

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - Create project (Admin only)
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          members: {
            create: { userId: req.user.id, projectRole: 'ADMIN' },
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });
      res.status(201).json(project);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/projects/:id - Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ ...project, myRole: member.projectRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project (Admin only)
router.put(
  '/:id',
  auth,
  isAdmin,
  [body('name').optional().trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const projectId = parseInt(req.params.id);
      const { name, description } = req.body;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: { name, description },
      });
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add member to project (Admin only)
router.post('/:id/members', auth, isAdmin, async (req, res) => {
  const { email, projectRole } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const projectId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId, projectRole: projectRole || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member (Admin only)
router.delete('/:id/members/:userId', auth, isAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from a project' });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
