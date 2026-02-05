import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import habitsRouter from './routes/habits';
import analyticsRouter from './routes/analytics';
import profileRouter from './routes/profile';
import settingsRouter from './routes/settings';
import friendsRouter from './routes/friends';
import postsRouter from './routes/posts';
import chatRouter from './routes/chat';
import challengesRouter from './routes/challenges';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/notifications', notificationsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
