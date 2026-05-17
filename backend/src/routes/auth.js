import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user);
    let manager = null;
    if (user.managerId) {
      manager = await User.findById(user.managerId).select('name email');
    }
    res.json({ token, user: { ...user.toJSON(), manager } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  let manager = null;
  if (req.user.managerId) {
    manager = await User.findById(req.user.managerId).select('name email');
  }
  res.json({ user: { ...req.user.toJSON(), manager } });
});

router.get('/demo-users', async (_req, res) => {
  const users = await User.find({ isActive: true })
    .select('email name role department')
    .limit(20);
  res.json({
    users,
    hint: 'Default password for seeded users: password123',
  });
});

export default router;
