import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all habits for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const habits = await prisma.habit.findMany({ where: { userId: req.user!.id } });
    res.json(habits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create a new habit
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, category, isPrivate } = req.body;
    const habit = await prisma.habit.create({
      data: {
        userId: req.user!.id,
        name,
        category,
        isPrivate: !!isPrivate,
        streak: 0,
        completedToday: false,
      },
    });

    res.json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update a habit
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, category, completedToday, streak, isPrivate, lastCompletedDate } = req.body;
    const habit = await prisma.habit.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(completedToday !== undefined && { completedToday }),
        ...(streak !== undefined && { streak }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(lastCompletedDate !== undefined && { lastCompletedDate }),
      },
    });

    res.json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Save daily activity
router.post('/activity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, completedHabits, totalHabits, completionRate } = req.body;
    const dateStr = String(date);
    const activity = await prisma.dailyActivity.upsert({
      where: { userId_date: { userId: req.user!.id, date: dateStr } },
      update: { completedHabits, totalHabits, completionRate },
      create: { userId: req.user!.id, date: dateStr, completedHabits, totalHabits, completionRate },
    });
    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save activity' });
  }
});

export default router;
