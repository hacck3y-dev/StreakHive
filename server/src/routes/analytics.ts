import { Router } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/summary', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const totalHabits = await prisma.habit.count({ where: { userId } });
  const activeStreak = await prisma.habit.aggregate({ _max: { streak: true }, where: { userId } });
  const recentActivity = await prisma.dailyActivity.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 });
  return res.json({ totalHabits, longestStreak: activeStreak._max.streak ?? 0, recentActivity });
});

export default router;
