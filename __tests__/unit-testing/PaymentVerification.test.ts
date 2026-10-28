import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { POST } from '@/app/api/payment/confirm/route';
import Enrollment from '@/models/Enrollment';
vi.mock('@/models/Enrollment', () => ({ default: { findOneAndUpdate: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
describe('Unverified payment confirmation', () => {
  it('requires authentication', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    expect((await POST()).status).toBe(401);
  });
  it('never grants enrollment without a verified payment provider', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'student-1' } } as any);
    const result = await POST();
    expect(result.status).toBe(503);
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
