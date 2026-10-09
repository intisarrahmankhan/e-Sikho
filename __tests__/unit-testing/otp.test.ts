import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestSignupOtp, requestLoginOtp, verifyPasswordAndSendLoginOtp } from '@/actions/otp';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { hashPassword } from '@/lib/auth-helpers';

// Mock dependencies
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/User', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/VerificationCode', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/lib/sms', () => ({
  sendOtpSms: vi.fn().mockResolvedValue({
    success: true,
    message: 'SMS পাঠানো হয়েছে',
    devCode: '123456',
  }),
}));

describe('OTP Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestSignupOtp', () => {
    it('rejects invalid or too short phone numbers', async () => {
      const result = await requestSignupOtp('01712');
      expect(result.success).toBe(false);
      expect(result.error).toContain('১১ ডিজিটের মোবাইল নম্বর');
    });

    it('rejects phone numbers that are already registered', async () => {
      (User.findOne as any).mockResolvedValue({ _id: '123', phone: '01712345678' });

      const result = await requestSignupOtp('01712345678');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ইতিমধ্যেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে');
    });

    it('enforces 60-second rate-limiting between OTP requests', async () => {
      (User.findOne as any).mockResolvedValue(null);
      (VerificationCode.findOne as any).mockResolvedValue({ _id: 'recent-otp' });

      const result = await requestSignupOtp('01712345678');
      expect(result.success).toBe(false);
      expect(result.error).toContain('১ মিনিট অপেক্ষা');
    });

    it('successfully generates and stores OTP for a valid new phone', async () => {
      (User.findOne as any).mockResolvedValue(null);
      (VerificationCode.findOne as any).mockResolvedValue(null);
      (VerificationCode.create as any).mockResolvedValue({ _id: 'new-otp' });

      const result = await requestSignupOtp('01712345678');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('01712345678');
      expect(result.devCode).toBe('123456');
      expect(VerificationCode.deleteMany).toHaveBeenCalled();
      expect(VerificationCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '01712345678',
          purpose: 'SIGNUP',
        })
      );
    });
  });

  describe('verifyPasswordAndSendLoginOtp (2FA flow)', () => {
    const validPassword = 'SecurePassword123';
    const hashedPassword = hashPassword(validPassword);

    it('rejects login when password is incorrect', async () => {
      (User.findOne as any).mockResolvedValue({
        _id: 'user-1',
        phone: '01712345678',
        password: hashedPassword,
        role: 'STUDENT',
      });

      const result = await verifyPasswordAndSendLoginOtp({
        identifier: '01712345678',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ভুল পাসওয়ার্ড');
    });

    it('verifies password and sends login OTP to user mobile number', async () => {
      (User.findOne as any).mockResolvedValue({
        _id: 'user-1',
        phone: '01712345678',
        password: hashedPassword,
        role: 'STUDENT',
      });
      (VerificationCode.findOne as any).mockResolvedValue(null);
      (VerificationCode.create as any).mockResolvedValue({ _id: 'otp-1' });

      const result = await verifyPasswordAndSendLoginOtp({
        identifier: '01712345678',
        password: validPassword,
      });

      expect(result.success).toBe(true);
      expect(result.phone).toBe('01712345678');
      expect(result.devCode).toBe('123456');
      expect(VerificationCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '01712345678',
          purpose: 'LOGIN',
        })
      );
    });

    it('works for Admin logging in with email and password', async () => {
      (User.findOne as any).mockResolvedValue({
        _id: 'admin-1',
        email: 'admin@esikho.com',
        phone: '01811223344',
        password: hashedPassword,
        role: 'ADMIN',
      });
      (VerificationCode.findOne as any).mockResolvedValue(null);
      (VerificationCode.create as any).mockResolvedValue({ _id: 'otp-2' });

      const result = await verifyPasswordAndSendLoginOtp({
        identifier: 'admin@esikho.com',
        password: validPassword,
      });

      expect(result.success).toBe(true);
      expect(result.phone).toBe('01811223344');
      expect(result.userRole).toBe('ADMIN');
    });
  });

  describe('requestLoginOtp', () => {
    it('rejects un-registered phone numbers during login', async () => {
      (User.findOne as any).mockResolvedValue(null);

      const result = await requestLoginOtp('01799999999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('কোনো অ্যাকাউন্ট পাওয়া যায়নি');
    });

    it('sends login OTP for existing users', async () => {
      (User.findOne as any).mockResolvedValue({ _id: 'existing-id', phone: '01712345678' });
      (VerificationCode.findOne as any).mockResolvedValue(null);
      (VerificationCode.create as any).mockResolvedValue({ _id: 'login-otp' });

      const result = await requestLoginOtp('01712345678');
      expect(result.success).toBe(true);
      expect(VerificationCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '01712345678',
          purpose: 'LOGIN',
        })
      );
    });
  });
});
