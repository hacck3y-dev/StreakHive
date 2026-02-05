import express from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Get own profile (auth required)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        profileVisibility: true,
        signupDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friendCount = await prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id },
        ],
      },
    });

    const postCount = await prisma.post.count({ where: { userId: req.user!.id } });

    res.json({
      ...user,
      friendCount,
      postCount,
      streak: 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user profile by ID (public/basic)
router.get('/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true, name: true, username: true, email: true, bio: true, avatarUrl: true, signupDate: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile (name, bio)
router.put('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, bio } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }), ...(bio !== undefined && { bio }) },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true, signupDate: true },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });

    // Delete old avatar if exists
    if (currentUser?.avatarUrl) {
      const oldAvatarPath = path.join(process.cwd(), currentUser.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Delete avatar
router.delete('/avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      const avatarPath = path.join(process.cwd(), user.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl: null } });
    }
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

export default router;
