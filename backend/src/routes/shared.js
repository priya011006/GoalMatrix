import express from 'express';
import SharedGoal from '../models/SharedGoal.js';
import GoalSheet from '../models/GoalSheet.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('manager', 'admin'));

function currentYear() {
  return new Date().getFullYear();
}

router.post('/push', async (req, res) => {
  try {
    const {
      title,
      description,
      thrustArea,
      uomType,
      target,
      defaultWeightage,
      primaryOwnerId,
      recipientIds,
      cycleYear,
    } = req.body;

    if (!title || !target || !primaryOwnerId || !recipientIds?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const year = cycleYear || currentYear();
    const allRecipients = [...new Set([...recipientIds, primaryOwnerId])];

    const shared = await SharedGoal.create({
      createdBy: req.user._id,
      title,
      description: description || '',
      thrustArea,
      uomType,
      target,
      defaultWeightage: defaultWeightage || 10,
      primaryOwnerId,
      recipientIds: allRecipients,
      cycleYear: year,
      linkedEntries: [],
    });

    for (const empId of allRecipients) {
      let sheet = await GoalSheet.findOne({ employeeId: empId, cycleYear: year });
      if (!sheet) {
        sheet = await GoalSheet.create({
          employeeId: empId,
          cycleYear: year,
          goals: [],
          status: 'draft',
        });
      }
      if (sheet.locked) continue;

      const isPrimary = empId.toString() === primaryOwnerId.toString();
      const goal = {
        thrustArea,
        title,
        description: description || '',
        uomType,
        target,
        weightage: defaultWeightage || 10,
        isShared: true,
        sharedGoalId: shared._id,
        readOnlyFields: !isPrimary,
        isPrimaryOwner: isPrimary,
      };

      sheet.goals.push(goal);
      await sheet.save();

      const addedGoal = sheet.goals[sheet.goals.length - 1];
      shared.linkedEntries.push({
        goalSheetId: sheet._id,
        goalId: addedGoal._id,
        employeeId: empId,
      });
    }

    await shared.save();

    await logAudit({
      entityType: 'SharedGoal',
      entityId: shared._id,
      user: req.user,
      action: 'PUSH_SHARED_GOAL',
      changes: { recipients: allRecipients.length },
      description: `Pushed shared KPI: ${title}`,
    });

    res.status(201).json({ shared, message: 'Shared goal pushed to recipients' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/list', async (req, res) => {
  const year = parseInt(req.query.year) || currentYear();
  const list = await SharedGoal.find({ cycleYear: year })
    .populate('createdBy', 'name')
    .populate('primaryOwnerId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ sharedGoals: list });
});

router.get('/employees', async (_req, res) => {
  const employees = await User.find({ role: 'employee', isActive: true }).select(
    'name email department managerId'
  );
  res.json({ employees });
});

export default router;
