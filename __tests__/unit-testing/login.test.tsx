import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';
import { loginWithGoogle } from '@/actions/auth';
import { useSearchParams } from 'next/navigation';

// Mock server actions and next/navigation
vi.mock('@/actions/auth', () => ({
  loginWithGoogle: vi.fn(),
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
    
    // Check if the payment alert is rendered
    expect(screen.getByText('কোর্সটি কিনতে আগে লগইন করুন')).toBeTruthy();

    const signInButton = screen.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/i });
    fireEvent.click(signInButton);

    expect(loginWithGoogle).toHaveBeenCalledWith('/payment/123');
  });
});
