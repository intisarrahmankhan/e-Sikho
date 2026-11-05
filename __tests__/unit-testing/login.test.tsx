import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '@/app/login/page';
import { loginWithGoogle, signUpWithPhone, signUpWithPhoneOtp, loginWithPhone } from '@/actions/auth';
import { requestSignupOtp, verifyPasswordAndSendLoginOtp } from '@/actions/otp';
import { useSearchParams } from 'next/navigation';

// Mock server actions and next/navigation
vi.mock('@/actions/auth', () => ({
  loginWithGoogle: vi.fn(),
  loginAsDeveloper: vi.fn(),
  signUpWithPhone: vi.fn(),
  signUpWithPhoneOtp: vi.fn(),
  loginWithPhone: vi.fn(),
  loginWithPhoneOtp: vi.fn(),
}));

vi.mock('@/actions/otp', () => ({
  requestSignupOtp: vi.fn(),
  verifyPasswordAndSendLoginOtp: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
  });

  afterEach(() => {
    cleanup();
    if (vi.isFakeTimers()) vi.clearAllTimers();
    vi.useRealTimers();
  });

  const fillSignupForm = () => {
    fireEvent.change(screen.getByPlaceholderText('আপনার পূর্ণ নাম লিখুন'), {
      target: { value: '  আহমেদ রাজিব  ' },
    });
    fireEvent.change(screen.getByPlaceholderText('017XXXXXXXX'), {
      target: { value: '01712-345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড'), {
      target: { value: 'password123' },
    });
  };

  const submitSignupForm = () => fireEvent.click(screen.getByRole('button', { name: 'সাইন আপ করুন' }));

  const openSignupOtpForm = async () => {
    vi.mocked(requestSignupOtp).mockResolvedValue({ success: true, phone: '01712345678', devCode: '123456' });
    render(<LoginPage />);
    fillSignupForm();
    submitSignupForm();
    await screen.findByRole('button', { name: 'যাচাই সম্পন্ন ও সাইন আপ করুন' });
  };

  it('renders the login page correctly', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<LoginPage />);

    expect(screen.getByText('e-Shikho')).toBeTruthy();
    expect(screen.getByText('Google দিয়ে সাইন ইন করুন')).toBeTruthy();
    expect(screen.getByText('মোবাইল দিয়ে সাইন আপ')).toBeTruthy();
    expect(screen.getByText('মোবাইল দিয়ে লগইন')).toBeTruthy();
  });

  it('calls loginWithGoogle with correct provider when clicked', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/i });
    fireEvent.click(signInButton);

    expect(loginWithGoogle).toHaveBeenCalledWith('/student');
  });

  it('passes the callbackUrl to loginWithGoogle if provided', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('callbackUrl=/payment/123') as ReturnType<typeof useSearchParams>);

    render(<LoginPage />);

    expect(screen.getByText('কোর্সটি কিনতে আগে লগইন করুন')).toBeTruthy();

    const signInButton = screen.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/i });
    fireEvent.click(signInButton);

    expect(loginWithGoogle).toHaveBeenCalledWith('/payment/123');
  });

  it('allows user to switch between sign up and login tabs', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<LoginPage />);

    // By default, on signup tab
    expect(screen.getByText('পুরো নাম')).toBeTruthy();

    // Click Login tab
    const loginTab = screen.getByRole('button', { name: 'মোবাইল দিয়ে লগইন' });
    fireEvent.click(loginTab);

    // Name field should not be present in login tab
    expect(screen.queryByText('পুরো নাম')).toBeNull();
    expect(screen.getByRole('button', { name: 'লগইন করুন' })).toBeTruthy();
  });

  it('requests signup OTP before attempting to create an account', async () => {
    await openSignupOtpForm();

    expect(requestSignupOtp).toHaveBeenCalledExactlyOnceWith('01712345678');
    expect(signUpWithPhone).not.toHaveBeenCalled();
    expect(signUpWithPhoneOtp).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('------')).toHaveValue('123456');
    expect(screen.getByText('লোকাল ডেমো কোড: 123456')).toBeVisible();
  });

  it.each([
    'এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।',
    'The verification SMS could not be sent. Please try again later or contact support.',
  ])('shows signup OTP errors and keeps the entered form: %s', async (error) => {
    vi.mocked(requestSignupOtp).mockResolvedValue({ success: false, error });
    render(<LoginPage />);
    fillSignupForm();
    submitSignupForm();

    expect(await screen.findByText(error)).toBeVisible();
    expect(screen.getByPlaceholderText('আপনার পূর্ণ নাম লিখুন')).toHaveValue('  আহমেদ রাজিব  ');
    expect(screen.getByPlaceholderText('017XXXXXXXX')).toHaveValue('01712-345678');
    expect(screen.queryByPlaceholderText('------')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'সাইন আপ করুন' })).toBeEnabled();
    expect(signUpWithPhoneOtp).not.toHaveBeenCalled();
  });

  it.each([undefined, null])('handles a missing signup OTP response (%s) and allows retry', async (response) => {
    vi.mocked(requestSignupOtp)
      .mockResolvedValueOnce(response as never)
      .mockResolvedValueOnce({ success: true, phone: '01712345678' });
    render(<LoginPage />);
    fillSignupForm();
    submitSignupForm();

    expect(await screen.findByText('ওটিপি পাঠাতে ব্যর্থ হয়েছে।')).toBeVisible();
    expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('------')).not.toBeInTheDocument();

    submitSignupForm();
    expect(await screen.findByPlaceholderText('------')).toBeVisible();
    expect(requestSignupOtp).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('ওটিপি পাঠাতে ব্যর্থ হয়েছে।')).not.toBeInTheDocument();
  });

  it('preserves signup details, selected role, and callback when verifying the OTP', async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('callbackUrl=/payment/123') as ReturnType<typeof useSearchParams>);
    vi.mocked(requestSignupOtp).mockResolvedValue({ success: true, phone: '01712345678' });
    vi.mocked(signUpWithPhoneOtp).mockResolvedValue({ success: false, error: 'Incorrect verification code' });
    render(<LoginPage />);
    fillSignupForm();
    fireEvent.click(screen.getByRole('button', { name: 'ইন্সট্রাক্টর' }));
    submitSignupForm();

    fireEvent.change(await screen.findByPlaceholderText('------'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'যাচাই সম্পন্ন ও সাইন আপ করুন' }));

    expect(await screen.findByText('Incorrect verification code')).toBeVisible();
    expect(signUpWithPhoneOtp).toHaveBeenCalledExactlyOnceWith({
      name: 'আহমেদ রাজিব',
      phone: '01712345678',
      otp: '654321',
      password: 'password123',
      role: 'INSTRUCTOR',
      callbackUrl: '/payment/123',
    });
    expect(screen.getByPlaceholderText('------')).toHaveValue('654321');
    expect(screen.queryByText('মোবাইল নম্বর যাচাই সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...')).not.toBeInTheDocument();
  });

  it.each([undefined, null])('does not report signup success for a missing verification response (%s)', async (response) => {
    vi.mocked(signUpWithPhoneOtp).mockResolvedValue(response as never);
    await openSignupOtpForm();
    fireEvent.click(screen.getByRole('button', { name: 'যাচাই সম্পন্ন ও সাইন আপ করুন' }));

    expect(await screen.findByText('ভেরিফিকেশন ব্যর্থ হয়েছে।')).toBeVisible();
    expect(screen.getByPlaceholderText('------')).toHaveValue('123456');
    expect(screen.queryByText('মোবাইল নম্বর যাচাই সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'যাচাই সম্পন্ন ও সাইন আপ করুন' })).toBeEnabled();
  });

  it('reports signup completion only after successful OTP verification', async () => {
    vi.useFakeTimers();
    vi.mocked(requestSignupOtp).mockResolvedValue({ success: true, devCode: '123456' });
    vi.mocked(signUpWithPhoneOtp).mockResolvedValue({ success: true, redirectTo: '/student' });
    render(<LoginPage />);
    fillSignupForm();
    await act(async () => { submitSignupForm(); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'যাচাই সম্পন্ন ও সাইন আপ করুন' }));
    });

    expect(screen.getByText('মোবাইল নম্বর যাচাই সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...')).toBeVisible();
    expect(signUpWithPhoneOtp).toHaveBeenCalledExactlyOnceWith({
      name: 'আহমেদ রাজিব',
      phone: '01712345678',
      otp: '123456',
      password: 'password123',
      role: 'STUDENT',
      callbackUrl: '/student',
    });
  });

  it('submits phone login with phone and password', async () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    (loginWithPhone as any).mockResolvedValue({ success: true });

    render(<LoginPage />);

    // Switch to login tab
    const loginTab = screen.getByRole('button', { name: 'মোবাইল দিয়ে লগইন' });
    fireEvent.click(loginTab);

    fireEvent.change(screen.getByPlaceholderText('017XXXXXXXX'), {
      target: { value: '01812345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('আপনার পাসওয়ার্ড দিন'), {
      target: { value: 'password123' },
    });

    const submitBtn = screen.getByRole('button', { name: 'লগইন করুন' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginWithPhone).toHaveBeenCalledWith({
        phone: '01812345678',
        password: 'password123',
        callbackUrl: '/student',
      });
    });
    expect(verifyPasswordAndSendLoginOtp).not.toHaveBeenCalled();
  });
});
