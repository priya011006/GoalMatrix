import mongoose from 'mongoose';
import goalSchema from './Goal.js';

const checkInSchema = new mongoose.Schema({
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actualAchievement: { type: String, default: null },
  completionDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['not_started', 'on_track', 'completed'],
    default: 'not_started',
  },
  progressScore: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now },
});

const goalSheetSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycleYear: { type: Number, required: true },
    goals: [goalSchema],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    locked: { type: Boolean, default: false },
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    checkIns: [checkInSchema],
    managerComments: [
      {
        quarter: String,
        comment: String,
        managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

goalSheetSchema.index({ employeeId: 1, cycleYear: 1 }, { unique: true });

export default mongoose.model('GoalSheet', goalSheetSchema);
