import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseForm from '@/components/instructor/CourseForm';
import { createCourse } from '@/actions/instructor';

// Mock the server action
vi.mock('@/actions/instructor', () => ({
  createCourse: vi.fn(),
}));

describe('CourseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<CourseForm />);
    expect(screen.getByText('Course Title *')).toBeTruthy();
    expect(screen.getByText('Description *')).toBeTruthy();
    expect(screen.getByText('Price (BDT) — 0 for free')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Submit Course for Review/i })).toBeTruthy();
  });

});
