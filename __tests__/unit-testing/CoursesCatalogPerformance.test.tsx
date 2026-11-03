import { beforeEach, describe, expect, it, vi } from 'vitest';
import CoursesPage from '@/app/courses/page';

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  findCourses: vi.fn(),
  populate: vi.fn(),
  lean: vi.fn(),
  findModules: vi.fn(),
  findLessons: vi.fn(),
  recommendations: vi.fn(),
  wishlist: vi.fn(),
}));

vi.mock('@/lib/mongoose', () => ({ default: mocks.connect }));
vi.mock('@/models/Course', () => ({ default: { find: mocks.findCourses } }));
vi.mock('@/models/Module', () => ({ default: { find: mocks.findModules } }));
vi.mock('@/models/Lesson', () => ({ default: { find: mocks.findLessons } }));
vi.mock('@/models/Instructor', () => ({ default: {} }));
vi.mock('@/actions/recommendations', () => ({
  getPersonalizedRecommendationsAction: mocks.recommendations,
}));
vi.mock('@/actions/wishlist', () => ({ getUserWishlistIdsAction: mocks.wishlist }));
vi.mock('@/components/courses/CoursesCatalog', () => ({ CoursesCatalog: () => null }));

function makeCourse(index: number) {
  return {
    _id: `course-${index}`,
    title: `Course ${index}`,
    tagline: 'A real catalog entry',
    category: 'programming',
    learningOutcomes: [],
    prerequisites: [],
    totalLessons: 12,
    instructor: { _id: 'instructor-1', name: 'Instructor' },
  };
}

describe('Catalog loading scalability', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.connect.mockResolvedValue(undefined);
    mocks.findCourses.mockReturnValue({ populate: mocks.populate });
    mocks.populate.mockReturnValue({ lean: mocks.lean });
    mocks.lean.mockResolvedValue([]);
    mocks.findModules.mockReturnValue({ sort: () => ({ lean: async () => [] }) });
    mocks.findLessons.mockReturnValue({ sort: () => ({ lean: async () => [] }) });
    mocks.recommendations.mockResolvedValue({ recommendations: [], studentProfile: null });
    mocks.wishlist.mockResolvedValue({ wishlistIds: ['course-1'] });
  });

  it.each([1, 100])('keeps catalog reads bounded with %i courses', async (courseCount) => {
    mocks.lean.mockResolvedValue(Array.from({ length: courseCount }, (_, index) => makeCourse(index)));

    const page = await CoursesPage();
    const catalog = page.props.children;

    expect(mocks.findCourses).toHaveBeenCalledExactlyOnceWith({
      approvalStatus: 'APPROVED', status: 'PUBLISHED',
    });
    expect(mocks.findModules).not.toHaveBeenCalled();
    expect(mocks.findLessons).not.toHaveBeenCalled();
    expect(catalog.props.additionalCourses).toHaveLength(courseCount);
    expect(catalog.props.additionalCourses[0]).toMatchObject({
      id: 'course-0', title: 'Course 0', totalLessons: 12,
      instructor: { name: 'Instructor' },
    });
    expect(catalog.props.userWishlistIds).toEqual(['course-1']);
  });

  it('starts the catalog read while personalized recommendations are pending', async () => {
    let finishRecommendations!: (result: { recommendations: []; studentProfile: null }) => void;
    mocks.recommendations.mockReturnValue(new Promise((resolve) => { finishRecommendations = resolve; }));

    const pendingPage = CoursesPage();
    try {
      await vi.waitFor(() => expect(mocks.findCourses).toHaveBeenCalledTimes(1));
      expect(mocks.wishlist).toHaveBeenCalledTimes(1);
    } finally {
      finishRecommendations({ recommendations: [], studentProfile: null });
      await pendingPage;
    }
  });
});
