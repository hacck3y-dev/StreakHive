import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = express.Router();

// Get social feed (Privacy-aware)
router.get('/feed', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const myId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: myId, status: 'ACCEPTED' },
          { receiverId: myId, status: 'ACCEPTED' },
        ],
      },
    });
    const friendIds = friendships.map((f) => (f.senderId === myId ? f.receiverId : f.senderId));

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { userId: myId },
          { user: { profileVisibility: 'PUBLIC' } },
          { userId: { in: friendIds }, user: { profileVisibility: 'FRIENDS' } },
        ],
      },
      include: {
        user: { select: { name: true, username: true, avatarUrl: true } },
        comments: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(posts);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Create a post
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const me = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, username: true, avatarUrl: true } });
    const authorName = me?.name ?? 'Anonymous';

    const post = await prisma.post.create({
      data: { userId: req.user!.id, author: authorName, content },
      include: { user: { select: { name: true, username: true, avatarUrl: true } } },
    });

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like/Unlike a post
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postId = String(req.params.id);
    const userId = req.user!.id;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let likedBy = [...post.likedBy];
    const index = likedBy.indexOf(userId);
    if (index > -1) {
      likedBy.splice(index, 1);
    } else {
      likedBy.push(userId);
    }

    const updated = await prisma.post.update({ where: { id: postId }, data: { likedBy, likes: likedBy.length } });

    if (index === -1) {
      await createNotification({ userId: post.userId, type: 'LIKE', senderId: userId, entityId: postId, content: 'liked your post' });
    }

    res.json({ likes: updated.likes, liked: likedBy.includes(userId) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Comment on a post
router.post('/:id/comment', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    const postId = String(req.params.id);
    if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });

    const me = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, avatarUrl: true } });
    const authorName = me?.name ?? 'Anonymous';

    const comment = await prisma.comment.create({
      data: { content, postId, userId: req.user!.id, author: authorName },
      include: { user: { select: { name: true, avatarUrl: true } }, post: true },
    });

    await createNotification({ userId: comment.post.userId, type: 'COMMENT', senderId: req.user!.id, entityId: postId, content: 'commented on your post' });

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
