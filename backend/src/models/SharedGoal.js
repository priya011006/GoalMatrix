import mongoose from 'mongoose';

const sharedGoalSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thrustArea: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    uomType: { type: String, required: true },
    target: { type: String, required: true },
    defaultWeightage: { type: Number, default: 10 },
    primaryOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    cycleYear: { type: Number, required: true },
    linkedEntries: [
      {
        goalSheetId: mongoose.Schema.Types.ObjectId,
        goalId: mongoose.Schema.Types.ObjectId,
        employeeId: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('SharedGoal', sharedGoalSchema);
