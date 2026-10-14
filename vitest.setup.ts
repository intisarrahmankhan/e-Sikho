import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: any) => children,
}));
