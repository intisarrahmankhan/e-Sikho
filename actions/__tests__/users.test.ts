import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaginatedUsers } from '../users';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Users Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPaginatedUsers', () => {
    it('should return paginated users without search parameters', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com', role: 'STUDENT', status: 'APPROVED', createdAt: new Date() },
        { id: '2', name: 'User 2', email: 'user2@example.com', role: 'INSTRUCTOR', status: 'APPROVED', createdAt: new Date() }
      ];
      
      // @ts-ignore
      prisma.user.findMany.mockResolvedValue(mockUsers);
      // @ts-ignore
      prisma.user.count.mockResolvedValue(2);

      const result = await getPaginatedUsers({ page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
      
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
    });

    it('should correctly apply search logic, mode insensitive, when searchEmail is provided', async () => {
      // @ts-ignore
      prisma.user.findMany.mockResolvedValue([]);
      // @ts-ignore
      prisma.user.count.mockResolvedValue(0);

      const result = await getPaginatedUsers({ page: 2, limit: 25, searchEmail: 'test@example.com' });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { email: { contains: 'test@example.com', mode: 'insensitive' } },
        skip: 25,
        take: 25,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ 
        where: { email: { contains: 'test@example.com', mode: 'insensitive' } } 
      });
    });
  });
});
