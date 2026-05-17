import AuditLog from '../models/AuditLog.js';

export async function logAudit({ entityType, entityId, user, action, changes, description }) {
  await AuditLog.create({
    entityType,
    entityId,
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action,
    changes,
    description,
  });
}
