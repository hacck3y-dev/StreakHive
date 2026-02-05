import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List reminders
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDone: 'asc' }, { remindAt: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create reminder
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, note, remindAt } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user!.id,
        title,
        note: note || null,
        remindAt: remindAt ? new Date(remindAt) : null,
      },
    });
    res.json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update reminder
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, note, remindAt, isDone } = req.body;
    const reminder = await prisma.reminder.update({
      where: { id: String(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(note !== undefined && { note: note || null }),
        ...(remindAt !== undefined && { remindAt: remindAt ? new Date(remindAt) : null }),
        ...(isDone !== undefined && { isDone }),
      },
    });
    res.json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete reminder
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.reminder.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
