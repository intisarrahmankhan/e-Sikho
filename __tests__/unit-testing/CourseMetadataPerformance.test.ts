import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/courses/[id]/route';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';

vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/Course', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/Module', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Lesson', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Instructor', () => ({}));
vi.mock('@/lib/bunny', () => ({ parseBunnyVideoUrl: () => null }));

const courseId = '507f1f77bcf86cd799439010';
const sorted = (data: any[]) => ({ sort: () => ({ lean: async () => data }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Course.findById).mockReturnValue({ populate: () => ({ lean: async () => ({ _id: courseId, title: 'Actual course', status: 'PUBLISHED' }) }) } as any);
});

describe('Course metadata query scalability', () => {
  it('uses one lesson query for 100 modules and preserves module/lesson grouping', async () => {
    const modules = Array.from({ length: 100 }, (_, n) => ({ _id: `module-${n}`, title: `Module ${n}` }));
    const lessons = modules.map((m, n) => ({ _id: `lesson-${n}`, moduleId: m._id, title: `Lesson ${n}`, videoUrl: 'private-video', pdfUrl: 'private-pdf' }));
    vi.mocked(Module.find).mockReturnValue(sorted(modules) as any);
    vi.mocked(Lesson.find).mockReturnValue(sorted(lessons) as any);
    const response = await GET(new Request(`http://localhost/api/courses/${courseId}`), { params: { id: courseId } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(Lesson.find).toHaveBeenCalledTimes(1);
    expect(Lesson.find).toHaveBeenCalledWith({ moduleId: { $in: modules.map((m) => m._id) } });
    expect(body.modules).toHaveLength(100);
    expect(body.modules[99].lessons[0]).toMatchObject({ id: 'lesson-99', title: 'Lesson 99' });
    expect(body.modules[0].lessons[0]).not.toHaveProperty('videoUrl');
    expect(body.modules[0].lessons[0]).not.toHaveProperty('pdfUrl');
  });

  it('does not query or invent lessons when no modules exist', async () => {
    vi.mocked(Module.find).mockReturnValue(sorted([]) as any);
    const response = await GET(new Request(`http://localhost/api/courses/${courseId}`), { params: { id: courseId } });
    expect((await response.json()).modules).toEqual([]);
    expect(Lesson.find).not.toHaveBeenCalled();
  });
});
