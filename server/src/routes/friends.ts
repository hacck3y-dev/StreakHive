import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = express.Router();

// Search users by username
router.get('/search', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username query required' });
    const usernameStr = Array.isArray(username) ? String(username[0]) : String(username);

    const blocked = await prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: req.user!.id }, { blockedId: req.user!.id }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocked.map((b) => (b.blockerId === req.user!.id ? b.blockedId : b.blockerId))
    );

    const users = await prisma.user.findMany({
      where: {
        username: { contains: usernameStr, mode: 'insensitive' },
        AND: [
          { id: { not: req.user!.id } },
          { id: { notIn: Array.from(blockedIds) } },
        ],
      },
      select: { id: true, name: true, username: true, avatarUrl: true, profileVisibility: true },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Send friend request by username
router.post('/request', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.id === req.user!.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: req.user!.id },
        ],
      },
    });
    if (existing) {
      return res.status(400).json({ error: 'Request already exists or already friends' });
    }

    const friendship = await prisma.friendship.create({
      data: { senderId: req.user!.id, receiverId: targetUser.id, status: 'PENDING' },
    });

    await createNotification({
      userId: targetUser.id,
      type: 'FRIEND_REQUEST',
      senderId: req.user!.id,
      entityId: friendship.id,
      content: 'sent you a friend request',
    });

    res.json({ message: 'Friend request sent', friendship });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// List incoming friend requests
router.get('/requests', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: req.user!.id, status: 'PENDING' },
      include: { sender: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Respond to friend request
router.put('/respond', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { requestId, action } = req.body; // action: 'ACCEPT' or 'REJECT'
    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const friendship = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!friendship || friendship.receiverId !== req.user!.id) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.friendship.update({
      where: { id: requestId },
      data: { status: action },
      include: { sender: true },
    });

    if (action === 'ACCEPT') {
      await createNotification({
        userId: updated.senderId,
        type: 'FRIEND_REQUEST',
        senderId: req.user!.id,
        entityId: updated.id,
        content: 'accepted your friend request',
      });
    }

    res.json({ message: `Request ${action.toLowerCase()}ed`, friendship: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

// List all friends (accepted friendships)
router.get('/list', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: req.user!.id, status: 'ACCEPTED' },
          { receiverId: req.user!.id, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const blocked = await prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: req.user!.id }, { blockedId: req.user!.id }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocked.map((b) => (b.blockerId === req.user!.id ? b.blockedId : b.blockerId))
    );

    const friends = friendships
      .map((f: any) => (f.senderId === req.user!.id ? f.receiver : f.sender))
      .filter((f: any) => !blockedIds.has(f.id));
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Block a user
router.post('/block', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    if (userId === req.user!.id) return res.status(400).json({ error: 'Cannot block yourself' });

    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: req.user!.id, blockedId: userId } },
      create: { blockerId: req.user!.id, blockedId: userId },
      update: {},
    });

    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock a user
router.post('/unblock', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    await prisma.blockedUser.deleteMany({
      where: { blockerId: req.user!.id, blockedId: userId },
    });

    res.json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// List blocked users
router.get('/blocked', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: req.user!.id },
      include: { blocked: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    res.json(blocked.map((b) => b.blocked));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// Get user profile by ID (privacy-aware)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const targetId = String(req.params.id);
    const myId = req.user!.id;

    const blocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: myId, blockedId: targetId },
          { blockerId: targetId, blockedId: myId },
        ],
      },
    });
    if (blocked) return res.status(403).json({ error: 'User is blocked' });

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        profileVisibility: true,
        signupDate: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const friendCount = await prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: myId, receiverId: user.id },
          { senderId: user.id, receiverId: myId },
        ],
      },
    });

    const postCount = await prisma.post.count({ where: { userId: user.id } });

    const profileData = {
      ...user,
      streak: 0,
      friendCount,
      postCount,
    } as any;

    if (user.id !== myId && user.profileVisibility !== 'PUBLIC') {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: myId, receiverId: user.id, status: 'ACCEPTED' },
            { senderId: user.id, receiverId: myId, status: 'ACCEPTED' },
          ],
        },
      });

      if (!friendship && user.profileVisibility === 'PRIVATE') {
        return res.status(403).json({ error: 'Profile is private' });
      }

      if (!friendship && user.profileVisibility === 'FRIENDS') {
        return res.json({
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          profileVisibility: user.profileVisibility,
          isRestricted: true,
          friendCount: profileData.friendCount,
          postCount: profileData.postCount,
          streak: 0,
        });
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
