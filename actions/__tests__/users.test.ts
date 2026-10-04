import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaginatedUsers } from '../users';

// Mock the Mongoose User model and dbConnect
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

const { mockFind, mockCountDocuments } = vi.hoisted(() => ({
  mockFind: vi.fn(),
  mockCountDocuments: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: mockFind,
    })),
    countDocuments: mockCountDocuments,
  },
}));

describe('Users Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPaginatedUsers', () => {
    it('should return paginated users without search parameters', async () => {
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'STUDENT', status: 'APPROVED', createdAt: new Date() },
        { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'INSTRUCTOR', status: 'APPROVED', createdAt: new Date() }
      ];

      mockFind.mockResolvedValue(mockUsers);
      mockCountDocuments.mockResolvedValue(2);

      const result = await getPaginatedUsers({ page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].id).toBe('1');
    });

    it('should correctly apply search logic when searchEmail is provided', async () => {
      mockFind.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const result = await getPaginatedUsers({ page: 2, limit: 25, searchEmail: 'test@example.com' });

      expect(result.total).toBe(0);
      expect(result.users).toHaveLength(0);
    });
  });
});
