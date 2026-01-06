import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  actorEmail: { type: String },
  action: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  targetEmail: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models?.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
