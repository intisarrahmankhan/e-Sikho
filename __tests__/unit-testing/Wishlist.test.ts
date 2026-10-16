import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleWishlistAction, getUserWishlistIdsAction, getWishlistCoursesAction } from '@/actions/wishlist';
import Wishlist from '@/models/Wishlist';
import User from '@/models/User';
import Course from '@/models/Course';
import { auth } from '@/auth';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/models/Wishlist', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/models/User', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/Course', () => ({
  default: {
    find: vi.fn(),
  },
}));

describe('Wishlist Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects toggle when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const res = await toggleWishlistAction('fullstack-nextjs');
    expect(res.error).toBe('NOT_AUTHENTICATED');
  });

  it('adds course to wishlist if not previously saved', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user_123', email: 'test@example.com' },
    } as any);

    vi.mocked(Wishlist.findOne).mockResolvedValueOnce(null);
    vi.mocked(Wishlist.create).mockResolvedValueOnce({
      userId: 'user_123',
      courseId: 'fullstack-nextjs',
    } as any);

    const res = await toggleWishlistAction('fullstack-nextjs');
    expect(res.success).toBe(true);
    expect(res.isWishlisted).toBe(true);
    expect(Wishlist.create).toHaveBeenCalled();
  });

  it('removes course from wishlist if already present', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user_123', email: 'test@example.com' },
    } as any);

    vi.mocked(Wishlist.findOne).mockResolvedValueOnce({
      _id: 'wish_999',
      userId: 'user_123',
      courseId: 'fullstack-nextjs',
    } as any);
    vi.mocked(Wishlist.deleteOne).mockResolvedValueOnce({ acknowledged: true, deletedCount: 1 } as any);

    const res = await toggleWishlistAction('fullstack-nextjs');
    expect(res.success).toBe(true);
    expect(res.isWishlisted).toBe(false);
    expect(Wishlist.deleteOne).toHaveBeenCalledWith({ _id: 'wish_999' });
  });

  it('returns empty wishlistIds when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const res = await getUserWishlistIdsAction();
    expect(res.success).toBe(true);
    expect(res.wishlistIds).toEqual([]);
  });

  it('fetches wishlist IDs for logged-in user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user_123' },
    } as any);

    vi.mocked(Wishlist.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce([
          { courseId: 'fullstack-nextjs' },
          { courseId: 'python-machine-learning' },
        ]),
      }),
    } as any);

    const res = await getUserWishlistIdsAction();
    expect(res.success).toBe(true);
    expect(res.wishlistIds).toEqual(['fullstack-nextjs', 'python-machine-learning']);
  });
});
