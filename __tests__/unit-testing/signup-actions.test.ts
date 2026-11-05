import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signIn } from '@/auth';
import { signUpWithPhoneOtp } from '@/actions/auth';

vi.mock('@/auth', () => ({ signIn: vi.fn() }));
vi.mock('next-auth', () => ({ AuthError: class AuthError extends Error {} }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('verified phone signup action', () => {
  const validSignup = {
    name: '  New Student  ',
    phone: '017-1234-5678',
    otp: ' 123456 ',
    password: 'password123',
  };

  beforeEach(() => {
    vi.mocked(signIn).mockReset();
    vi.mocked(signIn).mockResolvedValue('http://localhost:3000/student');
  });

  it('establishes the session without a redirect and returns a result for client navigation', async () => {
    await expect(signUpWithPhoneOtp(validSignup)).resolves.toEqual({
      success: true,
      redirectTo: 'http://localhost:3000/student',
    });
    expect(signIn).toHaveBeenCalledWith('credentials', {
      name: 'New Student',
      phone: '01712345678',
      otp: '123456',
      password: 'password123',
      role: 'STUDENT',
      isSignUp: 'true',
      redirect: false,
      redirectTo: '/student',
    });
  });

  it('preserves an explicit callback destination and instructor request', async () => {
    vi.mocked(signIn).mockResolvedValue('http://localhost:3000/payment/course-1');
    const result = await signUpWithPhoneOtp({
      ...validSignup,
      role: 'INSTRUCTOR',
      callbackUrl: '/payment/course-1',
    });
    expect(result).toEqual({ success: true, redirectTo: 'http://localhost:3000/payment/course-1' });
    expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      role: 'INSTRUCTOR', redirect: false, redirectTo: '/payment/course-1',
    }));
  });

  it('uses the instructor destination when no callback is supplied', async () => {
    vi.mocked(signIn).mockResolvedValue('http://localhost:3000/instructor');
    await expect(signUpWithPhoneOtp({ ...validSignup, role: 'INSTRUCTOR' })).resolves.toEqual({
      success: true,
      redirectTo: 'http://localhost:3000/instructor',
    });
  });

  it.each(['https://untrusted.example', '//untrusted.example', 'javascript:alert(1)'])(
    'returns the authentication provider destination for an unsafe callback %s',
    async (callbackUrl) => {
      vi.mocked(signIn).mockResolvedValue('http://localhost:3000');
      await expect(signUpWithPhoneOtp({ ...validSignup, callbackUrl })).resolves.toEqual({
        success: true,
        redirectTo: 'http://localhost:3000',
      });
    },
  );

  it.each([
    { field: 'name', value: ' ' },
    { field: 'phone', value: '01712' },
    { field: 'otp', value: '12345' },
    { field: 'password', value: 'short' },
  ])('rejects invalid $field before authenticating', async ({ field, value }) => {
    const result = await signUpWithPhoneOtp({ ...validSignup, [field]: value });
    expect(result).toEqual({ success: false, error: expect.any(String) });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('returns the provider error when signup verification is rejected', async () => {
    vi.mocked(signIn).mockRejectedValue({
      cause: { err: new Error('The verification code is invalid or expired.') },
    });
    await expect(signUpWithPhoneOtp(validSignup)).resolves.toEqual({
      success: false,
      error: 'The verification code is invalid or expired.',
    });
  });

  it('returns a useful error when credentials verification fails without a cause', async () => {
    vi.mocked(signIn).mockRejectedValue({ type: 'CredentialsSignin' });
    await expect(signUpWithPhoneOtp(validSignup)).resolves.toEqual({
      success: false,
      error: 'ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।',
    });
  });
});
