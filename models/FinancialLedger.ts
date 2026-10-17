import mongoose, { Document, Model, Schema } from 'mongoose';

export type LedgerEntryType =
  | 'PAYOUT_DISBURSEMENT' // Disbursed to instructor bank/MFS
  | 'PAYOUT_HOLD'         // Locked during payout request
  | 'PAYOUT_REFUND'       // Held funds returned to instructor wallet on rejection/cancellation
  | 'COURSE_SALE'         // Platform inflow from student enrollment
  | 'STUDENT_REFUND'      // Outflow/deduction upon approved student refund
  | 'COMMISSION_CREDIT'   // Platform earnings credit
  | 'ADJUSTMENT';         // Manual financial adjustment

export type LedgerDirection = 'DEBIT' | 'CREDIT';

export type LedgerAccountType =
  | 'INSTRUCTOR_BALANCE'  // Instructor wallet
  | 'ESCROW_PAYOUT_HOLD'  // Platform escrow hold for pending payouts
  | 'DISBURSED_OUTFLOW'   // Actual cash/MFS outflow disbursed
  | 'PLATFORM_REVENUE'    // Platform commission account
  | 'STUDENT_PAYMENT';    // Student payment account

export interface IFinancialLedger extends Document {
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  accountType: LedgerAccountType;
  amount: number;
  currency: string;
  userId?: mongoose.Types.ObjectId | string;
  payoutRequestId?: mongoose.Types.ObjectId | string;
  paymentId?: mongoose.Types.ObjectId | string;
  enrollmentId?: mongoose.Types.ObjectId | string;
  courseId?: mongoose.Types.ObjectId | string;
  referenceId: string; // Transaction reference or disbursement identifier
  provider?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'GATEWAY' | 'WALLET' | 'INTERNAL';
  accountNumber?: string;
  status: 'PENDING' | 'CLEARED' | 'REVERSED' | 'FAILED';
  description: string;
  performedBy?: mongoose.Types.ObjectId | string;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const financialLedgerSchema = new Schema<IFinancialLedger>(
  {
    entryType: {
      type: String,
      required: true,
      enum: [
        'PAYOUT_DISBURSEMENT',
        'PAYOUT_HOLD',
        'PAYOUT_REFUND',
        'COURSE_SALE',
        'STUDENT_REFUND',
        'COMMISSION_CREDIT',
        'ADJUSTMENT',
      ],
      index: true,
    },
    direction: {
      type: String,
      required: true,
      enum: ['DEBIT', 'CREDIT'],
    },
    accountType: {
      type: String,
      required: true,
      enum: [
        'INSTRUCTOR_BALANCE',
        'ESCROW_PAYOUT_HOLD',
        'DISBURSED_OUTFLOW',
        'PLATFORM_REVENUE',
        'STUDENT_PAYMENT',
      ],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    payoutRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PayoutRequest',
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'GATEWAY', 'WALLET', 'INTERNAL'],
      default: 'INTERNAL',
    },
    accountNumber: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'CLEARED', 'REVERSED', 'FAILED'],
      default: 'CLEARED',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    balanceBefore: {
      type: Number,
    },
    balanceAfter: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const FinancialLedger: Model<IFinancialLedger> =
  mongoose.models.FinancialLedger ||
  mongoose.model<IFinancialLedger>('FinancialLedger', financialLedgerSchema);

export default FinancialLedger;
