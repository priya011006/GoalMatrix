import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import User from '../models/User.js';
import * as XLSX from 'xlsx';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'manager'));

function currentYear() {
  return new Date().getFullYear();
}

async function buildReportData(year, managerId) {
  let employees = await User.find({ role: 'employee', isActive: true });
  if (managerId) {
    employees = employees.filter((e) => e.managerId?.toString() === managerId.toString());
  }

  const sheets = await GoalSheet.find({ cycleYear: year, employeeId: { $in: employees.map((e) => e._id) } })
    .populate('employeeId', 'name email department');

  const rows = [];
  for (const sheet of sheets) {
    const emp = sheet.employeeId;
    for (const goal of sheet.goals) {
      for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
        const ci = sheet.checkIns.find(
          (c) => c.quarter === quarter && c.goalId.toString() === goal._id.toString()
        );
        rows.push({
          Employee: emp.name,
          Email: emp.email,
          Department: emp.department,
          CycleYear: year,
          GoalStatus: sheet.status,
          ThrustArea: goal.thrustArea,
          GoalTitle: goal.title,
          UoM: goal.uomType,
          Target: goal.target,
          Weightage: goal.weightage,
          Quarter: quarter,
          ActualAchievement: ci?.actualAchievement ?? '',
          Status: ci?.status ?? '',
          ProgressScore: ci?.progressScore != null ? `${ci.progressScore.toFixed(1)}%` : '',
          IsShared: goal.isShared ? 'Yes' : 'No',
        });
      }
    }
  }
  return rows;
}

router.get('/achievement', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const managerId = req.user.role === 'manager' ? req.user._id : req.query.managerId;
    const rows = await buildReportData(year, managerId);
    res.json({ rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/achievement/export', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const managerId = req.user.role === 'manager' ? req.user._id : null;
    const rows = await buildReportData(year, managerId);
    const format = req.query.format || 'xlsx';

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=achievement-report-${year}.csv`);
      return res.send(csv);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Achievement Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=achievement-report-${year}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics', authorize('admin'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear();
    const sheets = await GoalSheet.find({ cycleYear: year, status: 'approved' });

    const byThrust = {};
    const byUom = {};
    const byStatus = { not_started: 0, on_track: 0, completed: 0 };
    let totalProgress = 0;
    let progressCount = 0;

    for (const sheet of sheets) {
      for (const goal of sheet.goals) {
        byThrust[goal.thrustArea] = (byThrust[goal.thrustArea] || 0) + 1;
        byUom[goal.uomType] = (byUom[goal.uomType] || 0) + 1;
        const latest = ['Q4', 'Q3', 'Q2', 'Q1']
          .map((q) => sheet.checkIns.find((c) => c.quarter === q && c.goalId.toString() === goal._id.toString()))
          .find(Boolean);
        if (latest) {
          byStatus[latest.status] = (byStatus[latest.status] || 0) + 1;
          if (latest.progressScore != null) {
            totalProgress += latest.progressScore;
            progressCount++;
          }
        }
      }
    }

    const quarterTrends = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      let sum = 0;
      let count = 0;
      for (const sheet of sheets) {
        for (const goal of sheet.goals) {
          const ci = sheet.checkIns.find(
            (c) => c.quarter === q && c.goalId.toString() === goal._id.toString()
          );
          if (ci?.progressScore != null) {
            sum += ci.progressScore;
            count++;
          }
        }
      }
      return { quarter: q, avgProgress: count ? Math.round(sum / count) : 0, dataPoints: count };
    });

    res.json({
      byThrust: Object.entries(byThrust).map(([name, value]) => ({ name, value })),
      byUom: Object.entries(byUom).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      avgProgress: progressCount ? Math.round(totalProgress / progressCount) : 0,
      quarterTrends,
      approvedSheets: sheets.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
