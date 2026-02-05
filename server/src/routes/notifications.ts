import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: { sender: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a single notification as read
router.put('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Helper function to create notifications (not an endpoint)
export const createNotification = async (data: {
  userId: string;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'MESSAGE' | 'ACHIEVEMENT';
  senderId?: string;
  entityId?: string;
  content?: string;
}) => {
  try {
    if (data.userId === data.senderId) return;
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        senderId: data.senderId,
        entityId: data.entityId,
        content: data.content,
      },
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

export default router;
