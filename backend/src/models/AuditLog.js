import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    userRole: String,
    action: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    description: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
