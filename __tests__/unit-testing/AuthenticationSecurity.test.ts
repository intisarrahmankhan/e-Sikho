import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { hashPassword } from '@/lib/auth-helpers';
const captured = vi.hoisted(() => ({ config: null as any }));
vi.mock('next-auth', () => ({ default: vi.fn((config) => { captured.config = config; return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }; }) }));
vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/User', () => ({ default: { findOne: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('@/models/VerificationCode', () => ({ default: { findOne: vi.fn(), deleteOne: vi.fn() } }));
const storedHash = hashPassword('correct-password');
let authorize: (credentials: any) => Promise<any>;
beforeAll(async () => {
  await vi.importActual('@/auth');
  const provider = captured.config.providers.find((provider: any) => provider.id === 'credentials');
  authorize = provider.options.authorize;
});
beforeEach(() => { vi.clearAllMocks(); });

describe('Authentication security', () => {
  it.each(['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERADMIN'])('never signs in using role alone: %s', async (role) => {
    expect(await authorize({ role })).toBeNull();
    expect(User.create).not.toHaveBeenCalled();
  });
  it('does not impersonate an existing account using only its email', async () => {
    expect(await authorize({ email: 'admin@example.test' })).toBeNull();
    expect(User.findOne).not.toHaveBeenCalled();
  });
  it('does not auto-create users from unauthenticated email requests', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    expect(await authorize({ email: 'unknown@example.test', password: 'anything' })).toBeNull();
    expect(User.create).not.toHaveBeenCalled();
  });
  it('verifies stored email passwords and takes the role from the database', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: '507f1f77bcf86cd799439011', email: 'student@example.test', password: storedHash, role: 'STUDENT', status: 'APPROVED' } as any);
    expect(await authorize({ email: 'student@example.test', password: 'wrong-password' })).toBeNull();
    expect(await authorize({ email: 'student@example.test', password: 'correct-password', role: 'SUPERADMIN' })).toMatchObject({ role: 'STUDENT' });
  });
  it('requires proof of identity for phone login', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: '507f1f77bcf86cd799439011', phone: '01712345678', password: storedHash, role: 'ADMIN', status: 'APPROVED' } as any);
    expect(await authorize({ phone: '01712345678' })).toBeNull();
  });
  it('requires an OTP for new phone registration', async () => {
    await expect(authorize({ phone: '01712345678', isSignUp: 'true', password: 'correct-password' })).rejects.toThrow('OTP');
    expect(User.create).not.toHaveBeenCalled();
  });
  it('rejects invalid signup OTPs before creating an account', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(VerificationCode.findOne).mockReturnValue({ sort: async () => null } as any);
    await expect(authorize({ phone: '01712345678', isSignUp: 'true', otp: '123456' })).rejects.toThrow();
    expect(User.create).not.toHaveBeenCalled();
  });
  it('preserves existing OAuth roles and does not overwrite account status', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ role: 'INSTRUCTOR', status: 'APPROVED' } as any);
    await captured.config.callbacks.signIn({ user: { email: 'instructor@example.test', name: 'Instructor' }, account: { provider: 'google' } });
    const update = vi.mocked(User.findOneAndUpdate).mock.calls[0][1] as any;
    expect(update.$set).not.toHaveProperty('role');
    expect(update.$set).not.toHaveProperty('status');
    expect(update.$setOnInsert.role).toBe('STUDENT');
  });
  it('does not invent user IDs or recreate deleted accounts during session refresh', async () => {
    vi.mocked(User.findOne).mockReturnValue({ select: () => ({ lean: async () => null }) } as any);
    expect(await captured.config.callbacks.jwt({ token: { id: '507f1f77bcf86cd799439011', email: 'deleted@example.test' } })).toBeNull();
    expect(User.create).not.toHaveBeenCalled();
  });
  it('revokes existing sessions when the database account is suspended', async () => {
    vi.mocked(User.findOne).mockReturnValue({ select: () => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439011', status: 'SUSPENDED', role: 'ADMIN' }) }) } as any);
    expect(await captured.config.callbacks.jwt({ token: { id: '507f1f77bcf86cd799439011' } })).toBeNull();
  });
});
