import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List all challenges
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let challenges = await prisma.challenge.findMany({
      include: { joinedUsers: { where: { userId: req.user!.id } } },
    });

    if (challenges.length === 0) {
      const seeds = [
        {
          name: '7-Day Hydration',
          description: 'Drink enough water every day for a week.',
          participants: 0,
          duration: '7 days',
        },
        {
          name: 'Morning Walk',
          description: '10–20 minute walk every morning.',
          participants: 0,
          duration: '14 days',
        },
        {
          name: 'No Sugar Week',
          description: 'Avoid added sugar and track how you feel.',
          participants: 0,
          duration: '7 days',
        },
        {
          name: 'Read 10 Pages',
          description: 'Read at least 10 pages a day.',
          participants: 0,
          duration: '21 days',
        },
        {
          name: 'Sleep On Time',
          description: 'Go to bed before your target time each night.',
          participants: 0,
          duration: '14 days',
        },
      ];

      for (const seed of seeds) {
        const room = await prisma.chatRoom.create({
          data: { isGroup: true, name: seed.name },
        });
        await prisma.challenge.create({
          data: { ...seed, roomId: room.id },
        });
      }

      challenges = await prisma.challenge.findMany({
        include: { joinedUsers: { where: { userId: req.user!.id } } },
      });
    }

    const missingRoom = challenges.filter((c) => !c.roomId);
    if (missingRoom.length > 0) {
      for (const c of missingRoom) {
        const room = await prisma.chatRoom.create({
          data: { isGroup: true, name: c.name },
        });
        await prisma.challenge.update({
          where: { id: c.id },
          data: { roomId: room.id },
        });
      }
      challenges = await prisma.challenge.findMany({
        include: { joinedUsers: { where: { userId: req.user!.id } } },
      });
    }

    const formatted = challenges.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      participants: c.participants,
      duration: c.duration,
      joined: c.joinedUsers.length > 0,
      habitId: c.joinedUsers[0]?.habitId || undefined,
      roomId: c.roomId,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Join a challenge
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const challengeId = String(req.params.id);
    const userId = req.user!.id;

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const existing = await prisma.challengeParticipant.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) return res.status(400).json({ error: 'Already joined this challenge' });

    const result = await prisma.$transaction(async (tx) => {
      const habit = await tx.habit.create({
        data: {
          userId,
          name: challenge.name,
          category: 'Challenge',
          streak: 0,
          completedToday: false,
        },
      });

      const participant = await tx.challengeParticipant.create({
        data: { userId, challengeId, habitId: habit.id },
      });

      if (challenge.roomId) {
        await tx.chatParticipant.create({ data: { userId, roomId: challenge.roomId } });
      }

      await tx.challenge.update({
        where: { id: challengeId },
        data: { participants: { increment: 1 } },
      });

      return { habit, participant };
    });

    res.json({ message: 'Joined successfully', habit: result.habit, habitId: result.habit.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

// Leave a challenge
router.post('/:id/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const challengeId = String(req.params.id);
    const userId = req.user!.id;

    const participant = await prisma.challengeParticipant.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (!participant) return res.status(400).json({ error: 'Not a participant of this challenge' });

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });

    await prisma.$transaction(async (tx) => {
      if (participant.habitId) {
        await tx.habit.delete({ where: { id: participant.habitId } });
      }

      await tx.challengeParticipant.delete({
        where: { userId_challengeId: { userId, challengeId } },
      });

      if (challenge?.roomId) {
        await tx.chatParticipant.delete({ where: { userId_roomId: { userId, roomId: challenge.roomId } } });
      }

      await tx.challenge.update({
        where: { id: challengeId },
        data: { participants: { decrement: 1 } },
      });
    });

    res.json({ message: 'Left successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave challenge' });
  }
});

export default router;
