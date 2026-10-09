import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';
import { loginWithGoogle, signUpWithPhone, loginWithPhone } from '@/actions/auth';
import { useSearchParams } from 'next/navigation';

// Mock server actions and next/navigation
vi.mock('@/actions/auth', () => ({
  loginWithGoogle: vi.fn(),
  signUpWithPhone: vi.fn(),
  loginWithPhone: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue('/payment/123'),
    });

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

  it('submits phone signup with valid information', async () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    (signUpWithPhone as any).mockResolvedValue({ success: true });

    render(<LoginPage />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('আপনার পূর্ণ নাম লিখুন'), {
      target: { value: 'আহমেদ রাজিব' },
    });
    fireEvent.change(screen.getByPlaceholderText('017XXXXXXXX'), {
      target: { value: '01712345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড'), {
      target: { value: 'password123' },
    });

    const submitBtn = screen.getByRole('button', { name: 'সাইন আপ করুন' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signUpWithPhone).toHaveBeenCalledWith({
        name: 'আহমেদ রাজিব',
        phone: '01712345678',
        password: 'password123',
        role: 'STUDENT',
        callbackUrl: '/student',
      });
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
  });
});
