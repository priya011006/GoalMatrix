import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateGoals } from '../utils/validation.js';
import { logAudit } from '../services/audit.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('manager', 'admin'));

function currentYear() {
  return new Date().getFullYear();
}

router.get('/team', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const managerId = req.user.role === 'admin' && req.query.managerId ? req.query.managerId : req.user._id;

    const team = await User.find({ managerId, role: 'employee', isActive: true }).select(
      'name email department'
    );
    const sheets = await GoalSheet.find({
      employeeId: { $in: team.map((t) => t._id) },
      cycleYear: year,
    });

    const result = team.map((member) => {
      const sheet = sheets.find((s) => s.employeeId.toString() === member._id.toString());
      return {
        employee: member,
        sheet: sheet || null,
        status: sheet?.status || 'not_started',
        goalsCount: sheet?.goals?.length || 0,
        locked: sheet?.locked || false,
      };
    });

    const pending = result.filter((r) => r.status === 'submitted').length;
    const approved = result.filter((r) => r.status === 'approved').length;

    res.json({ team: result, stats: { total: team.length, pending, approved } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sheet/:sheetId', async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId).populate(
      'employeeId',
      'name email department managerId'
    );
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    if (req.user.role === 'manager') {
      const emp = await User.findById(sheet.employeeId);
      if (emp.managerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not your team member' });
      }
    }

    res.json({ sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/sheet/:sheetId', async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId).populate('employeeId');
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (sheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Can only edit goals during approval (submitted status)' });
    }

    if (req.user.role === 'manager') {
      const emp = sheet.employeeId;
      if (emp.managerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not your team member' });
      }
    }

    const goals = req.body.goals;
    const validation = validateGoals(goals);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    const oldGoals = JSON.parse(JSON.stringify(sheet.goals));
    sheet.goals = goals;
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'MANAGER_EDIT',
      changes: { before: oldGoals, after: goals },
      description: 'Manager edited goals during approval',
    });

    res.json({ sheet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/approve/:sheetId', async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId).populate('employeeId');
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (sheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Sheet must be in submitted status' });
    }

    const validation = validateGoals(sheet.goals);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    sheet.status = 'approved';
    sheet.locked = true;
    sheet.approvedAt = new Date();
    sheet.approvedBy = req.user._id;
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'APPROVE',
      description: 'Manager approved and locked goals',
    });

    res.json({ sheet, message: 'Goals approved and locked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/reject/:sheetId', async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId).populate('employeeId');
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    sheet.status = 'rejected';
    sheet.locked = false;
    sheet.rejectedAt = new Date();
    sheet.rejectionReason = req.body.reason || 'Returned for rework';
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'REJECT',
      changes: { reason: sheet.rejectionReason },
      description: 'Manager returned goals for rework',
    });

    res.json({ sheet, message: 'Goals returned for rework' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/check-in-comment/:sheetId', async (req, res) => {
  try {
    const { quarter, comment } = req.body;
    const sheet = await GoalSheet.findById(req.params.sheetId).populate('employeeId');
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    if (req.user.role === 'manager') {
      if (sheet.employeeId.managerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not your team member' });
      }
    }

    sheet.managerComments.push({
      quarter,
      comment,
      managerId: req.user._id,
    });
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'CHECK_IN_COMMENT',
      changes: { quarter, comment },
      description: 'Manager added check-in comment',
    });

    res.json({ sheet, message: 'Check-in comment saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
