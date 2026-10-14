import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVerificationCode extends Document {
  phone: string;
  code: string;
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['SIGNUP', 'LOGIN', 'PASSWORD_RESET'],
      default: 'SIGNUP',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: documents are automatically deleted once expiresAt is reached
    },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Composite index to quickly fetch latest active code for a given phone and purpose
verificationCodeSchema.index({ phone: 1, purpose: 1, expiresAt: 1 });

const VerificationCode: Model<IVerificationCode> =
  mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', verificationCodeSchema);

export default VerificationCode;
