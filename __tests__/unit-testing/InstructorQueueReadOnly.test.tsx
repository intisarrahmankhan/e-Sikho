import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const state = vi.hoisted(() => ({
  profiles: [] as any[],
  requests: [] as any[],
  applications: [] as any[],
  writeProfile: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { role: 'SUPERADMIN' } })) }));
vi.mock('@/lib/mongoose', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/InstructorProfile', () => ({
  default: {
    find: () => {
      const query = {
        populate: () => query,
        sort: () => query,
        lean: async () => state.profiles,
      };
      return query;
    },
    findOneAndUpdate: state.writeProfile,
    create: state.writeProfile,
  },
}));
vi.mock('@/models/InstructorRequest', () => ({
  default: {
    find: () => {
      const query = { populate: () => query, lean: async () => state.requests };
      return query;
    },
  },
}));
vi.mock('@/components/admin/InstructorApplicationQueue', () => ({
  default: ({ initialApplications }: any) => {
    state.applications = initialApplications;
    return <div>Application queue</div>;
  },
}));

import PendingInstructorsPage from '@/app/(dashboard)/admin/instructors/pending/page';

describe('Instructor application queue reads', () => {
  beforeEach(() => {
    state.profiles = [];
    state.requests = [];
    state.applications = [];
    state.writeProfile.mockReset();
  });

  it('shows a real legacy request without persisting invented qualifications', async () => {
    state.requests = [{
      _id: 'request-one', userId: { _id: 'user-one', name: 'Applicant' },
      reason: 'I want to teach my subject.', status: 'PENDING', createdAt: '2026-11-01T10:00:00Z',
    }];
    render(await PendingInstructorsPage());
    expect(state.writeProfile).not.toHaveBeenCalled();
    expect(state.applications).toEqual([expect.objectContaining({
      id: 'request-one', userId: 'user-one', qualifications: [], experienceYears: 0,
      subjectSpecialization: 'Not provided', bio: 'I want to teach my subject.',
    })]);
  });

  it('keeps requests visible alongside profiles and avoids duplicate applications for one user', async () => {
    state.profiles = [{
      _id: 'profile-one', userId: { _id: 'user-one' }, qualifications: ['Actual qualification'],
      experienceYears: 5, subjectSpecialization: 'Physics', approval_status: 'Pending',
    }];
    state.requests = [
      { _id: 'request-one', userId: { _id: 'user-one' }, status: 'PENDING' },
      { _id: 'request-two', userId: { _id: 'user-two' }, status: 'PENDING' },
    ];
    render(await PendingInstructorsPage());
    expect(state.applications.map((app) => app.id)).toEqual(['profile-one', 'request-two']);
    expect(state.applications[0].qualifications).toEqual(['Actual qualification']);
    expect(state.writeProfile).not.toHaveBeenCalled();
  });
});
