import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approveDemoPurchase, getPendingDemoPurchases, submitDemoPurchase } from '@/actions/demo-purchases';

const { auth, dbConnect, findCourse, findEnrollment, updateEnrollment } = vi.hoisted(() => ({
  auth: vi.fn(),
  dbConnect: vi.fn(),
  findCourse: vi.fn(),
  findEnrollment: vi.fn(),
  updateEnrollment: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth }));
vi.mock('@/lib/mongoose', () => ({ default: dbConnect }));
vi.mock('@/models/Course', () => ({ default: { findOne: findCourse } }));
vi.mock('@/models/Enrollment', () => ({
  default: { findOne: findEnrollment, updateOne: updateEnrollment },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const courseId = '65f000000000000000000001';
const purchaseId = '65f000000000000000000002';
const learner = { id: '65f000000000000000000003', role: 'STUDENT', status: 'APPROVED' };

function selected(value: unknown) {
  return { select: () => ({ lean: async () => value }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ENABLE_DEMO_CHECKOUT', 'true');
  auth.mockResolvedValue({ user: learner });
  findCourse.mockReturnValue(selected({ _id: courseId, price: 500 }));
  findEnrollment.mockReturnValue(selected(null));
  updateEnrollment.mockResolvedValue({ upsertedCount: 1 });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('demo purchases', () => {
  it('blocks all demo purchase actions before accessing the database when disabled', async () => {
    vi.stubEnv('ENABLE_DEMO_CHECKOUT', 'false');

    await expect(submitDemoPurchase(courseId)).resolves.toMatchObject({ success: false });
    await expect(getPendingDemoPurchases()).resolves.toMatchObject({ success: false });
    await expect(approveDemoPurchase(purchaseId)).resolves.toMatchObject({ success: false });
    expect(dbConnect).not.toHaveBeenCalled();
    expect(updateEnrollment).not.toHaveBeenCalled();
  });

  it('blocks a student from reading the admin queue or approving a request', async () => {
    const forbidden = { success: false, error: 'Admin access required.' };

    await expect(getPendingDemoPurchases()).resolves.toEqual(forbidden);
    await expect(approveDemoPurchase(purchaseId)).resolves.toEqual(forbidden);
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it.each([
    ['signed out', null],
    ['unapproved', { user: { ...learner, status: 'PENDING' } }],
  ])('blocks a %s learner from requesting access', async (_state, session) => {
    auth.mockResolvedValue(session);

    await expect(submitDemoPurchase(courseId)).resolves.toMatchObject({ success: false });
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it('uses the saved course price and records a pending request with zero amount paid', async () => {
    await expect(submitDemoPurchase(courseId)).resolves.toEqual({ success: true });

    expect(updateEnrollment).toHaveBeenCalledExactlyOnceWith(
      { userId: learner.id, courseId },
      { $setOnInsert: {
        paymentStatus: 'DEMO_PENDING',
        amountPaid: 0,
        demoPurchase: { amount: 500, requestedAt: expect.any(Date) },
      } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  });

  it('keeps an existing active enrollment intact', async () => {
    findEnrollment.mockReturnValue(selected({ paymentStatus: 'GRANTED' }));

    await expect(submitDemoPurchase(courseId)).resolves.toMatchObject({ success: false });
    expect(updateEnrollment).not.toHaveBeenCalled();
  });

  it('reuses an existing pending demo request', async () => {
    findEnrollment.mockReturnValue(selected({ paymentStatus: 'DEMO_PENDING' }));

    await expect(submitDemoPurchase(courseId)).resolves.toEqual({ success: true, alreadyPending: true });
    expect(updateEnrollment).not.toHaveBeenCalled();
  });
});
