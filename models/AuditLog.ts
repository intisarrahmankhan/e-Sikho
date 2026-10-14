import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  category: 'FINANCIAL' | 'SECURITY' | 'SYSTEM' | 'USER_MANAGEMENT' | 'COURSE_MANAGEMENT';
  actorId: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ['FINANCIAL', 'SECURITY', 'SYSTEM', 'USER_MANAGEMENT', 'COURSE_MANAGEMENT'],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
  }
);

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
