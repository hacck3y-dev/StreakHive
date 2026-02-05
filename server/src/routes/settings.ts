import express from 'express';
import { prisma } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = express.Router();

interface UserSettings {
  emailNotifications: boolean;
  habitReminders: boolean;
  weeklyReports: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  showStreak: boolean;
  showActivity: boolean;
}

// Get settings (using User table for now, can create separate Settings table later)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true } });
    // Return default settings for now
    // In production, you'd create a Settings table
    const settings: UserSettings = {
      emailNotifications: true,
      habitReminders: true,
      weeklyReports: false,
      profileVisibility: 'public',
      showStreak: true,
      showActivity: true,
    };
    res.json({ user, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update profile (Name, Email)
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }), ...(email && { email }) },
      select: { id: true, name: true, email: true },
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashedPassword } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Update privacy settings (placeholder for now)
router.put('/privacy', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { profileVisibility, showStreak, showActivity } = req.body;
    // In production, store these in a separate Settings table
    // For now, just return success
    res.json({
      message: 'Settings updated',
      settings: { profileVisibility, showStreak, showActivity },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
