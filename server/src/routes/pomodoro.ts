import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.pomodoroSettings.findUnique({
      where: { userId: req.user!.id },
    });
    res.json(
      settings || {
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLong: 4,
        autoStartBreaks: false,
        autoStartFocus: false,
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pomodoro settings' });
  }
});

// Update settings
router.put('/settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      cyclesBeforeLong,
      autoStartBreaks,
      autoStartFocus,
    } = req.body;

    const settings = await prisma.pomodoroSettings.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        focusMinutes: focusMinutes ?? 25,
        shortBreakMinutes: shortBreakMinutes ?? 5,
        longBreakMinutes: longBreakMinutes ?? 15,
        cyclesBeforeLong: cyclesBeforeLong ?? 4,
        autoStartBreaks: !!autoStartBreaks,
        autoStartFocus: !!autoStartFocus,
      },
      update: {
        ...(focusMinutes !== undefined && { focusMinutes }),
        ...(shortBreakMinutes !== undefined && { shortBreakMinutes }),
        ...(longBreakMinutes !== undefined && { longBreakMinutes }),
        ...(cyclesBeforeLong !== undefined && { cyclesBeforeLong }),
        ...(autoStartBreaks !== undefined && { autoStartBreaks }),
        ...(autoStartFocus !== undefined && { autoStartFocus }),
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update pomodoro settings' });
  }
});

// Track a session
router.post('/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type, plannedMinutes, startedAt, endedAt, completed } = req.body;
    if (!type || !plannedMinutes) {
      return res.status(400).json({ error: 'Type and plannedMinutes required' });
    }
    const session = await prisma.pomodoroSession.create({
      data: {
        userId: req.user!.id,
        type,
        plannedMinutes,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : null,
        completed: !!completed,
      },
    });
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save pomodoro session' });
  }
});

export default router;
