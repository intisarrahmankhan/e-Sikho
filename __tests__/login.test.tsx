import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

// Mock next-auth and next/navigation
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
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
  });

  it('calls signIn with correct provider when clicked', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/i });
    fireEvent.click(signInButton);

    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/student' });
  });

  it('passes the callbackUrl to signIn if provided', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue('/payment/123'),
    });

    render(<LoginPage />);
    
    // Check if the payment alert is rendered
    expect(screen.getByText('কোর্সটি কিনতে আগে লগইন করুন')).toBeTruthy();

    const signInButton = screen.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/i });
    fireEvent.click(signInButton);

    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/payment/123' });
  });
});
