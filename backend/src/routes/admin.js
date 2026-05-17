import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { getCurrentCyclePhase, isDemoMode } from '../utils/cycle.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin'));

function currentYear() {
  return new Date().getFullYear();
}

router.get('/dashboard', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const employees = await User.find({ role: 'employee', isActive: true });
    const sheets = await GoalSheet.find({ cycleYear: year });

    const stats = {
      totalEmployees: employees.length,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      notStarted: 0,
    };

    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));
    const sheetMap = new Map(sheets.map((s) => [s.employeeId.toString(), s]));

    for (const emp of employees) {
      const sheet = sheetMap.get(emp._id.toString());
      if (!sheet) stats.notStarted++;
      else stats[sheet.status === 'not_started' ? 'notStarted' : sheet.status]++;
    }

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const checkInCompletion = quarters.map((q) => {
      const completed = sheets.filter(
        (s) =>
          s.status === 'approved' &&
          s.goals.length > 0 &&
          s.goals.every((g) =>
            s.checkIns.some(
              (c) => c.quarter === q && c.goalId.toString() === g._id.toString() && c.status
            )
          )
      ).length;
      return { quarter: q, completed, total: sheets.filter((s) => s.status === 'approved').length };
    });

    res.json({
      stats,
      checkInCompletion,
      cyclePhase: getCurrentCyclePhase(),
      demoMode: isDemoMode(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (_req, res) => {
  const users = await User.find({ isActive: true })
    .select('name email role department managerId')
    .populate('managerId', 'name email');
  res.json({ users });
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/unlock/:sheetId', async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    sheet.locked = false;
    sheet.status = 'draft';
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'ADMIN_UNLOCK',
      description: 'Admin unlocked goal sheet for editing',
    });

    res.json({ sheet, message: 'Goal sheet unlocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/audit-logs', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email role');
  res.json({ logs });
});

router.get('/completion-dashboard', async (req, res) => {
  const year = parseInt(req.query.year) || currentYear();
  const quarter = req.query.quarter || 'Q1';

  const employees = await User.find({ role: 'employee', isActive: true }).populate(
    'managerId',
    'name email'
  );
  const sheets = await GoalSheet.find({ cycleYear: year });

  const rows = employees.map((emp) => {
    const sheet = sheets.find((s) => s.employeeId.toString() === emp._id.toString());
    let checkInDone = false;
    if (sheet?.status === 'approved' && sheet.goals.length) {
      checkInDone = sheet.goals.every((g) =>
        sheet.checkIns.some((c) => c.quarter === quarter && c.goalId.toString() === g._id.toString())
      );
    }
    return {
      employee: { id: emp._id, name: emp.name, email: emp.email, department: emp.department },
      manager: emp.managerId
        ? { name: emp.managerId.name, email: emp.managerId.email }
        : null,
      sheetId: sheet?._id || null,
      goalStatus: sheet?.status || 'not_started',
      checkInDone,
      managerCommentDone: sheet?.managerComments?.some((c) => c.quarter === quarter) || false,
    };
  });

  res.json({ quarter, year, rows });
});

export default router;
