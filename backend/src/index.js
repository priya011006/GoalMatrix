import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import goalsRoutes from './routes/goals.js';
import managerRoutes from './routes/manager.js';
import adminRoutes from './routes/admin.js';
import sharedRoutes from './routes/shared.js';
import reportsRoutes from './routes/reports.js';
import metaRoutes from './routes/meta.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else if (process.env.CLIENT_URL && origin?.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, allowedOrigins[0] || true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'GoalMatrix API', demoMode: process.env.DEMO_MODE === 'true' });
});

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/meta', metaRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`GoalMatrix API running on port ${PORT}`);
    console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  });
}

start();
