import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateUserStatus } from '@/actions/admin';
const { mockFindByIdAndUpdate } = vi.hoisted(() => ({
mockFindByIdAndUpdate: vi.fn(),
}));
vi.mock('@/auth', () => ({
auth: vi.fn().mockResolvedValue({
user: { id: 'admin-1', role: 'SUPERADMIN' },
}),
}));
vi.mock('@/lib/mongoose', () => ({
default: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/models/User', () => ({
default: { findByIdAndUpdate: mockFindByIdAndUpdate },
}));
vi.mock('@/models/AuditLog', () => ({
default: { create: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('next/cache', () => ({
revalidatePath: vi.fn(),
}));
describe('updateUserStatus', () => {
beforeEach(() => vi.clearAllMocks());
it('updates status and returns success', async () => {
mockFindByIdAndUpdate.mockResolvedValueOnce({
_id: 'user-1',
status: 'APPROVED',
});
const result = await updateUserStatus('user-1', 'APPROVED');
expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('user-1', {
status: 'APPROVED',
});
expect(result).toEqual({ success: true });
});
});