import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import SharedGoal from '../models/SharedGoal.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateGoals, validateGoalsDraft } from '../utils/validation.js';
import { computeProgressScore } from '../utils/progress.js';
import { isGoalSettingOpen, isCheckInOpen, isDemoMode, getCurrentCyclePhase } from '../utils/cycle.js';
import { logAudit } from '../services/audit.js';

const router = express.Router();
router.use(authenticate);

function currentYear() {
  return new Date().getFullYear();
}

async function syncSharedAchievement(sharedGoalId, goalId, quarter, actual, completionDate, status) {
  const shared = await SharedGoal.findById(sharedGoalId);
  if (!shared) return;

  const primaryEntry = shared.linkedEntries.find(
    (e) => e.employeeId.toString() === shared.primaryOwnerId.toString()
  );
  if (!primaryEntry || primaryEntry.goalId.toString() !== goalId.toString()) return;

  for (const entry of shared.linkedEntries) {
    if (entry.employeeId.toString() === shared.primaryOwnerId.toString()) continue;
    const sheet = await GoalSheet.findById(entry.goalSheetId);
    if (!sheet) continue;
    const goal = sheet.goals.id(entry.goalId);
    if (!goal) continue;

    let checkIn = sheet.checkIns.find(
      (c) => c.quarter === quarter && c.goalId.toString() === entry.goalId.toString()
    );
    if (!checkIn) {
      sheet.checkIns.push({
        quarter,
        goalId: entry.goalId,
        actualAchievement: actual,
        completionDate,
        status: status || 'on_track',
      });
      checkIn = sheet.checkIns[sheet.checkIns.length - 1];
    } else {
      checkIn.actualAchievement = actual;
      checkIn.completionDate = completionDate;
      checkIn.status = status || checkIn.status;
    }
    checkIn.progressScore = computeProgressScore(goal, actual, completionDate);
    checkIn.updatedAt = new Date();
    await sheet.save();
  }
}

router.get('/my-sheet', authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const employeeId = req.user.role === 'employee' ? req.user._id : req.query.employeeId || req.user._id;

    let sheet = await GoalSheet.findOne({ employeeId, cycleYear: year }).populate(
      'employeeId',
      'name email department'
    );
    if (!sheet && req.user.role === 'employee') {
      sheet = await GoalSheet.create({
        employeeId: req.user._id,
        cycleYear: year,
        goals: [],
        status: 'draft',
      });
    }
    const phase = getCurrentCyclePhase();
    res.json({
      sheet,
      cyclePhase: phase,
      goalSettingOpen: isDemoMode() || isGoalSettingOpen(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/my-sheet', authorize('employee'), async (req, res) => {
  try {
    const year = parseInt(req.body.cycleYear) || currentYear();
    if (!isDemoMode() && !isGoalSettingOpen()) {
      return res.status(403).json({
        message: 'Goal setting is only open from 1st May during the goal-setting phase.',
      });
    }

    let sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleYear: year });
    if (!sheet) {
      sheet = new GoalSheet({ employeeId: req.user._id, cycleYear: year });
    }
    if (sheet.locked || sheet.status === 'approved') {
      return res.status(403).json({ message: 'Goals are locked. Contact Admin to unlock.' });
    }
    if (sheet.status === 'submitted') {
      return res.status(403).json({ message: 'Goals are submitted for approval. Withdraw first or wait for manager.' });
    }

    const goals = req.body.goals || [];
    for (const g of goals) {
      if (g.isShared && g.readOnlyFields) {
        const existing = sheet.goals.id(g._id);
        if (existing) {
          g.title = existing.title;
          g.target = existing.target;
          g.description = existing.description;
          g.thrustArea = existing.thrustArea;
          g.uomType = existing.uomType;
        }
      }
    }

    const validation = validateGoalsDraft(goals);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    const startedGoals = goals.filter(
      (g) => g.title?.trim() || g.thrustArea || g.target || g.weightage
    );
    sheet.goals = startedGoals;
    if (sheet.status === 'rejected' || sheet.status === 'draft') sheet.status = 'draft';
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'UPDATE_GOALS',
      changes: { goalsCount: goals.length },
      description: 'Employee updated draft goals',
    });

    res.json({ sheet, message: 'Goals saved as draft' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/submit', authorize('employee'), async (req, res) => {
  try {
    const year = parseInt(req.body.cycleYear) || currentYear();
    const sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleYear: year });
    if (!sheet) return res.status(404).json({ message: 'No goal sheet found' });
    if (sheet.locked) return res.status(403).json({ message: 'Goals are locked' });

    const validation = validateGoals(sheet.goals);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    sheet.status = 'submitted';
    sheet.submittedAt = new Date();
    await sheet.save();

    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'SUBMIT',
      description: 'Employee submitted goals for approval',
    });

    res.json({ sheet, message: 'Goals submitted for manager approval' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/check-in', authorize('employee'), async (req, res) => {
  try {
    const { quarter, updates } = req.body;
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      return res.status(400).json({ message: 'Invalid quarter' });
    }
    if (!isDemoMode() && !isCheckInOpen(quarter)) {
      return res.status(403).json({
        message: `${quarter} check-in window is not currently open.`,
      });
    }

    const year = parseInt(req.body.cycleYear) || currentYear();
    const sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleYear: year });
    if (!sheet || sheet.status !== 'approved') {
      return res.status(403).json({ message: 'Goals must be approved before check-ins' });
    }

    for (const u of updates || []) {
      const goal = sheet.goals.id(u.goalId);
      if (!goal) continue;

      let checkIn = sheet.checkIns.find(
        (c) => c.quarter === quarter && c.goalId.toString() === u.goalId
      );
      if (!checkIn) {
        sheet.checkIns.push({
          quarter,
          goalId: u.goalId,
          actualAchievement: u.actualAchievement,
          completionDate: u.completionDate,
          status: u.status,
        });
        checkIn = sheet.checkIns[sheet.checkIns.length - 1];
      } else {
        checkIn.actualAchievement = u.actualAchievement;
        checkIn.completionDate = u.completionDate;
        checkIn.status = u.status;
      }
      checkIn.progressScore = computeProgressScore(
        goal,
        u.actualAchievement,
        u.completionDate
      );
      checkIn.updatedAt = new Date();

      if (goal.isShared && goal.isPrimaryOwner && goal.sharedGoalId) {
        await syncSharedAchievement(
          goal.sharedGoalId,
          u.goalId,
          quarter,
          u.actualAchievement,
          u.completionDate,
          u.status
        );
      }
    }

    await sheet.save();
    await logAudit({
      entityType: 'GoalSheet',
      entityId: sheet._id,
      user: req.user,
      action: 'CHECK_IN',
      changes: { quarter, count: updates?.length },
      description: `Employee updated ${quarter} check-in`,
    });

    res.json({ sheet, message: `${quarter} check-in saved` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
