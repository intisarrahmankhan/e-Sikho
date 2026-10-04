import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayoutRequest extends Document {
  instructorId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  status: 'REQUESTED' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  mfsProvider: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
  mfsNumber: string;
  transactionId?: string;
  rejectionReason?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: 'Instructor' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'DISBURSED', 'REJECTED'],
      default: 'REQUESTED',
    },
    mfsProvider: {
      type: String,
      enum: ['BKASH', 'NAGAD', 'ROCKET', 'BANK'],
      required: true,
    },
    mfsNumber: { type: String, required: true },
    transactionId: { type: String },
    rejectionReason: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const PayoutRequest: Model<IPayoutRequest> =
  mongoose.models.PayoutRequest || mongoose.model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);

export default PayoutRequest;
