import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  thrustArea: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  uomType: {
    type: String,
    enum: ['numeric_min', 'numeric_max', 'percentage_min', 'percentage_max', 'timeline', 'zero'],
    required: true,
  },
  target: { type: String, required: true },
  weightage: { type: Number, required: true, min: 10, max: 100 },
  isShared: { type: Boolean, default: false },
  sharedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedGoal', default: null },
  readOnlyFields: { type: Boolean, default: false },
  isPrimaryOwner: { type: Boolean, default: false },
});

export default goalSchema;
