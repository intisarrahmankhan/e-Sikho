import mongoose, { Document, Model, Schema } from 'mongoose';

export type PayoutStatus = 'PENDING' | 'REQUESTED' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
export type PayoutProvider = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';

export interface IPayoutRequest extends Document {
  instructorId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  status: PayoutStatus;
  mfsProvider: PayoutProvider;
  mfsNumber: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  transactionId?: string;
  rejectionReason?: string;
  adminNotes?: string;
  approvedBy?: mongoose.Types.ObjectId | string;
  approvedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId | string;
  disbursedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId | string;
  rejectedAt?: Date;
  ledgerTransactionId?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: 'Instructor' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'REQUESTED', 'APPROVED', 'DISBURSED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    mfsProvider: {
      type: String,
      enum: ['BKASH', 'NAGAD', 'ROCKET', 'BANK'],
      required: true,
    },
    mfsNumber: { type: String, required: true },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    transactionId: { type: String, index: true },
    rejectionReason: { type: String },
    adminNotes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    ledgerTransactionId: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const PayoutRequest: Model<IPayoutRequest> =
  mongoose.models.PayoutRequest || mongoose.model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);

export default PayoutRequest;
