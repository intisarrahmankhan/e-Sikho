import { createHmac, timingSafeEqual } from 'crypto';
import { AUTH_SECRET } from '@/lib/auth-secret';
import VerificationCode from '@/models/VerificationCode';

type OtpChallenge = { phone: string; purpose: 'SIGNUP' | 'LOGIN'; userId?: string };
const MAX_ATTEMPTS = 5;

export function hashOtp(code: string, challenge: OtpChallenge): string {
  const secret = AUTH_SECRET || process.env.AUTH_SECRET || (process.env.NODE_ENV === 'test' ? 'test-auth-secret-for-unit-tests-123' : undefined);
  if (!secret) throw new Error('Authentication is not configured. Please contact support.');
  return createHmac('sha256', secret)
    .update(JSON.stringify([challenge.phone, challenge.purpose, challenge.userId || '', code]))
    .digest('hex');
}

/** Claim an attempt atomically, then consume a correct code exactly once. */
export async function consumeOtp(code: string, challenge: OtpChallenge): Promise<boolean> {
  if (!/^\d{6}$/.test(code) || (challenge.purpose === 'LOGIN' && !challenge.userId)) return false;
  const codeHash = hashOtp(code, challenge);
  const record = await VerificationCode.findOneAndUpdate(
    { ...challenge, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: -1 } },
  );
  if (!record || !/^[a-f0-9]{64}$/.test(record.code)) return false;
  if (!timingSafeEqual(Buffer.from(record.code, 'hex'), Buffer.from(codeHash, 'hex'))) return false;
  const consumed = await VerificationCode.findOneAndDelete({
    _id: record._id,
    code: codeHash,
    expiresAt: { $gt: new Date() },
    attempts: { $lte: MAX_ATTEMPTS },
  });
  return !!consumed;
}
