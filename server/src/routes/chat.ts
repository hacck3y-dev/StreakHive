import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = express.Router();

// List all chat rooms for the current user
router.get('/rooms', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { participants: { some: { userId: req.user!.id } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const blocked = await prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: req.user!.id }, { blockedId: req.user!.id }] },
      select: { blockerId: true, blockedId: true },
    });

    const blockedIds = new Set(
      blocked.map((b) => (b.blockerId === req.user!.id ? b.blockedId : b.blockerId))
    );

    const filtered = rooms.filter((room) => {
      if (room.isGroup) return true;
      const other = room.participants.find((p) => p.userId !== req.user!.id)?.user;
      return other?.id ? !blockedIds.has(other.id) : true;
    });

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Get or create a private chat room with a friend
router.post('/rooms', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

    const blocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: req.user!.id, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: req.user!.id },
        ],
      },
    });
    if (blocked) return res.status(403).json({ error: 'User is blocked' });

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: req.user!.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
      },
    });

    if (existingRoom) {
      return res.json(existingRoom);
    }

    const newRoom = await prisma.chatRoom.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: req.user!.id },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
      },
    });

    res.json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Fetch message history for a room
router.get('/rooms/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const roomId = String(req.params.id);

    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_roomId: { userId: req.user!.id, roomId } },
    });
    if (!participant) return res.status(403).json({ error: 'Not authorized to view these messages' });

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (room && !room.isGroup) {
      const otherId = room.participants.find((p) => p.userId !== req.user!.id)?.userId;
      if (otherId) {
        const blocked = await prisma.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: req.user!.id, blockedId: otherId },
              { blockerId: otherId, blockedId: req.user!.id },
            ],
          },
        });
        if (blocked) return res.status(403).json({ error: 'User is blocked' });
      }
    }

    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/rooms/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const roomId = String(req.params.id);
    const { content, replyToId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_roomId: { userId: req.user!.id, roomId } },
    });
    if (!participant) return res.status(403).json({ error: 'Not authorized to post in this room' });

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (room && !room.isGroup) {
      const otherId = room.participants.find((p) => p.userId !== req.user!.id)?.userId;
      if (otherId) {
        const blocked = await prisma.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: req.user!.id, blockedId: otherId },
              { blockerId: otherId, blockedId: req.user!.id },
            ],
          },
        });
        if (blocked) return res.status(403).json({ error: 'User is blocked' });
      }
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { roomId, senderId: req.user!.id, content, replyToId: replyToId || null },
        include: {
          sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } }),
    ]);

    const otherParticipants = await prisma.chatParticipant.findMany({
      where: { roomId, NOT: { userId: req.user!.id } },
    });
    await Promise.all(
      otherParticipants.map((p) =>
        createNotification({
          userId: p.userId,
          type: 'MESSAGE',
          senderId: req.user!.id,
          entityId: roomId,
          content: 'sent you a message',
        })
      )
    );

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
