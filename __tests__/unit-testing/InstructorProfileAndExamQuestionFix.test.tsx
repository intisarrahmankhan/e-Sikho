import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamCreateForm } from '@/components/exam/ExamCreateForm';
import { InstructorSettingsClient, InstructorProfile } from '@/components/dashboard/InstructorSettingsClient';
import { LanguageProvider } from '@/context/LanguageContext';
import * as instructorActions from '@/actions/instructor';
import * as examActions from '@/actions/exam';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/actions/exam', () => ({
  createExamAction: vi.fn(),
}));

vi.mock('@/actions/instructor', () => ({
  updateInstructorProfileAction: vi.fn(),
  updateInstructorPasswordAction: vi.fn(),
}));

const mockInstructorProfile: InstructorProfile = {
  id: 'inst-1',
  name: 'Professor Tareq',
  email: 'tareq@example.com',
  phone: '01712345678',
  headline: 'Senior Principal Engineer & Computer Science Coach',
  instructorTitle: 'Senior Principal Engineer & Computer Science Coach',
  bio: 'Experienced educator with over 10 years in industry and academia.',
  organization: 'BUET / Dhaka Tech',
  experienceYears: 8,
  academicBackground: 'M.Sc in Computer Science, BUET',
  targetTrack: 'Fullstack Web Development',
  expertise: ['Fullstack Web Development', 'Data Structures & Algorithms', 'System Design & Distributed Systems'],
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'Docker'],
  weeklyGoalHours: 15,
  website: 'https://tareq.dev',
  github: 'https://github.com/tareq',
  linkedin: 'https://linkedin.com/in/tareq',
  twitter: 'https://twitter.com/tareq',
  payoutMethod: 'BKASH',
  payoutNumber: '01712345678',
  availableBalance: 25000,
  totalEarnings: 150000,
  role: 'INSTRUCTOR',
  status: 'APPROVED',
  totalCourses: 4,
  publishedCourses: 3,
  totalStudents: 1420,
  averageRating: 4.9,
};

describe('ExamCreateForm - True/False Removal & Add Question Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without True/False format option and has MCQ, Short Answer, and Code options', () => {
    render(
      <LanguageProvider>
        <ExamCreateForm />
      </LanguageProvider>
    );

    // Verify MCQ, Short Answer, and Code tabs are present
    expect(screen.getAllByText('MCQ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('সংক্ষিপ্ত উত্তর').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/কোডিং/i).length).toBeGreaterThan(0);

    // Verify True/False option is NOT in the format selector tabs
    expect(screen.queryByText('সত্য/মিথ্যা')).not.toBeInTheDocument();
    expect(screen.queryByText(/True\/False Auto-Grading/i)).not.toBeInTheDocument();
  });

  it('adds a new question when clicking the top Add New Question button', () => {
    render(
      <LanguageProvider>
        <ExamCreateForm />
      </LanguageProvider>
    );

    // Initial questions count is 3 (MCQ, Short Answer, Code)
    expect(screen.getByText('প্রশ্নাবলি (3 টি)')).toBeInTheDocument();

    const addBtn = screen.getByTestId('add-new-question-btn');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    // Question count should increase to 4
    expect(screen.getByText('প্রশ্নাবলি (4 টি)')).toBeInTheDocument();
    expect(screen.getByText('প্রশ্ন 4')).toBeInTheDocument();
  });

  it('provides a bottom Add Another Question button that also adds questions', () => {
    render(
      <LanguageProvider>
        <ExamCreateForm />
      </LanguageProvider>
    );

    const bottomBtn = screen.getByTestId('add-question-bottom-btn');
    expect(bottomBtn).toBeInTheDocument();

    fireEvent.click(bottomBtn);

    expect(screen.getByText('প্রশ্নাবলি (4 টি)')).toBeInTheDocument();
    expect(screen.getByText('প্রশ্ন 4')).toBeInTheDocument();
  });
});

describe('InstructorSettingsClient - Tailored Profile for Instructor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders instructor header stats, badges, and metrics', () => {
    render(
      <LanguageProvider>
        <InstructorSettingsClient initialProfile={mockInstructorProfile} />
      </LanguageProvider>
    );

    expect(screen.getByText('Professor Tareq')).toBeInTheDocument();
    expect(screen.getByText(/Senior Principal Engineer/i)).toBeInTheDocument();
    expect(screen.getByText('BUET / Dhaka Tech')).toBeInTheDocument();
    expect(screen.getByText(/8 বছরের শিক্ষকতা অভিজ্ঞতা|8 Years Experience/i)).toBeInTheDocument();

    // Verify metric cards
    expect(screen.getByText('1420')).toBeInTheDocument(); // students
    expect(screen.getByText('4.9')).toBeInTheDocument(); // rating
    expect(screen.getByText('৳25000')).toBeInTheDocument(); // balance
  });

  it('allows navigating to Teaching & Expertise tab and toggles chips', async () => {
    render(
      <LanguageProvider>
        <InstructorSettingsClient initialProfile={mockInstructorProfile} />
      </LanguageProvider>
    );

    const teachingTab = screen.getByRole('button', { name: /শিক্ষা ও বিশেষজ্ঞতা|Teaching & Expertise/i });
    fireEvent.click(teachingTab);

    expect(screen.getByText(/Primary Instructional Track|প্রধান শিক্ষণ ট্র্যাক/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Mentorship & Live QA Target|সাপ্তাহিক লাইভ ক্লাস/i)).toBeInTheDocument();

    // Skills & technologies
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('allows navigating to Payouts & Banking tab and displays financial setup', async () => {
    render(
      <LanguageProvider>
        <InstructorSettingsClient initialProfile={mockInstructorProfile} />
      </LanguageProvider>
    );

    const payoutTab = screen.getByRole('button', { name: /উইথড্রয়াল ও পেমেন্ট|Payouts & Banking/i });
    fireEvent.click(payoutTab);

    expect(screen.getAllByText('৳25000').length).toBeGreaterThan(0);
    expect(screen.getByText('৳150000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /BKASH/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /NAGAD/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /BANK/i })).toBeInTheDocument();
  });

  it('calls updateInstructorProfileAction when saving profile', async () => {
    (instructorActions.updateInstructorProfileAction as any).mockResolvedValue({ success: true });

    render(
      <LanguageProvider>
        <InstructorSettingsClient initialProfile={mockInstructorProfile} />
      </LanguageProvider>
    );

    const saveBtn = screen.getByRole('button', { name: /প্রোফাইল তথ্য সংরক্ষণ করুন|Save Profile Details/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(instructorActions.updateInstructorProfileAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Professor Tareq',
          phone: '01712345678',
          headline: 'Senior Principal Engineer & Computer Science Coach',
          organization: 'BUET / Dhaka Tech',
        })
      );
    });
  });
});
