import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/login/page';
import { verifyPasswordAndSendLoginOtp } from '@/actions/otp';

vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: (key: string) => key === 'tab' ? 'login' : null }) }));
vi.mock('@/actions/auth', () => ({ loginWithGoogle: vi.fn(), signUpWithPhone: vi.fn(), signUpWithPhoneOtp: vi.fn(), loginWithPhone: vi.fn(), loginWithPhoneOtp: vi.fn() }));
vi.mock('@/actions/otp', () => ({ requestSignupOtp: vi.fn(), verifyPasswordAndSendLoginOtp: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyPasswordAndSendLoginOtp).mockResolvedValue({ success: false, error: 'Controlled verification result' });
});

describe('Login identifier entry', () => {
  it('preserves hyphens in email local parts and domains', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('017XXXXXXXX'), { target: { value: '  learner-name@e-school.test  ' } });
    fireEvent.change(screen.getByPlaceholderText('আপনার পাসওয়ার্ড দিন'), { target: { value: 'EnteredPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'লগইন করুন' }));
    await waitFor(() => expect(verifyPasswordAndSendLoginOtp).toHaveBeenCalledWith({ identifier: 'learner-name@e-school.test', password: 'EnteredPassword123!' }));
  });
  it('still normalizes formatting in phone numbers', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('017XXXXXXXX'), { target: { value: '(017) 123-45678' } });
    fireEvent.change(screen.getByPlaceholderText('আপনার পাসওয়ার্ড দিন'), { target: { value: 'EnteredPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'লগইন করুন' }));
    await waitFor(() => expect(verifyPasswordAndSendLoginOtp).toHaveBeenCalledWith({ identifier: '01712345678', password: 'EnteredPassword123!' }));
  });
});
