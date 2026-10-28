import mongoose, { Schema } from 'mongoose';

const permissionSchema = new Schema({
  instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['EXAM', 'CONTEST'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: { type: String, default: '' },
}, { timestamps: true });
permissionSchema.index({ instructorId: 1, kind: 1 }, { unique: true });
export default mongoose.models.GlobalAssessmentPermission || mongoose.model('GlobalAssessmentPermission', permissionSchema);
