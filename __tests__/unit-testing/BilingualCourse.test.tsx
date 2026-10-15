import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import React, { useEffect } from 'react';

function LanguageSetter({ targetLang, children }: { targetLang: 'bn' | 'en'; children: React.ReactNode }) {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    setLanguage(targetLang);
  }, [targetLang, setLanguage]);

  return <>{children}</>;
}

describe('Bilingual Course Display & Fallback Rules', () => {
  const dualLanguageCourse = {
    id: 'course-1',
    title: 'ফুলস্ট্যাক নেক্সট জেএস ও পাইথন',
    titleEn: 'Fullstack Next.js and Python Masterclass',
    thumbnailUrl: '/thumbnails/bn-thumbnail.jpg',
    thumbnailUrlEn: '/thumbnails/en-thumbnail.jpg',
    progressPercentage: 45,
    targetCompletionDate: '2026-11-01',
  };

  const banglaOnlyCourse = {
    id: 'course-2',
    title: 'বাংলায় ডাটাস্ট্রাকচার ও অ্যালগরিদম',
    thumbnailUrl: '/thumbnails/dsa-bn.jpg',
    progressPercentage: 20,
    targetCompletionDate: '2026-12-15',
  };

  it('displays Bangla title and thumbnail in Bangla mode even when English exists', () => {
    render(
      <LanguageProvider>
        <LanguageSetter targetLang="bn">
          <CourseCard course={dualLanguageCourse} />
        </LanguageSetter>
      </LanguageProvider>
    );

    expect(screen.getByText('ফুলস্ট্যাক নেক্সট জেএস ও পাইথন')).toBeTruthy();
    expect(screen.queryByText('Fullstack Next.js and Python Masterclass')).toBeNull();

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/thumbnails/bn-thumbnail.jpg');
    expect(screen.getByText('এনরোল্ড')).toBeTruthy();
  });

  it('displays English title and thumbnail when language is toggled to English', () => {
    render(
      <LanguageProvider>
        <LanguageSetter targetLang="en">
          <CourseCard course={dualLanguageCourse} />
        </LanguageSetter>
      </LanguageProvider>
    );

    expect(screen.getByText('Fullstack Next.js and Python Masterclass')).toBeTruthy();
    expect(screen.queryByText('ফুলস্ট্যাক নেক্সট জেএস ও পাইথন')).toBeNull();

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/thumbnails/en-thumbnail.jpg');
    expect(screen.getByText('Enrolled')).toBeTruthy();
  });

  it('falls back to Bangla title and thumbnail in English mode if instructor did not provide English versions', () => {
    render(
      <LanguageProvider>
        <LanguageSetter targetLang="en">
          <CourseCard course={banglaOnlyCourse} />
        </LanguageSetter>
      </LanguageProvider>
    );

    // Should retain original instructor-provided Bangla title and thumbnail without breaking
    expect(screen.getByText('বাংলায় ডাটাস্ট্রাকচার ও অ্যালগরিদম')).toBeTruthy();

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/thumbnails/dsa-bn.jpg');
    // Platform static text is still English
    expect(screen.getByText('Enrolled')).toBeTruthy();
    expect(screen.getByText(/Completed/i)).toBeTruthy();
  });

  it('correctly translates durations, categories, and levels via bilingual helpers', async () => {
    const { formatBilingualDuration, translateCategory, translateLevel } = await import('@/context/LanguageContext');

    // Durations
    expect(formatBilingualDuration('১০ ঘণ্টা', '10 hours', 'en')).toBe('10 hours');
    expect(formatBilingualDuration('১০ ঘণ্টা', undefined, 'en')).toBe('10 hours');
    expect(formatBilingualDuration('৪৫ মিনিট', undefined, 'en')).toBe('45 mins');
    expect(formatBilingualDuration('১০ ঘণ্টা', '10 hours', 'bn')).toBe('১০ ঘণ্টা');

    // Categories
    expect(translateCategory('web-dev', 'en')).toBe('Web Development');
    expect(translateCategory('ওয়েব ডেভেলপমেন্ট', 'en')).toBe('Web Development');
    expect(translateCategory('web-dev', 'bn')).toBe('ওয়েব ডেভেলপমেন্ট');

    // Levels
    expect(translateLevel('বিগিনার', 'en')).toBe('Beginner');
    expect(translateLevel('ইন্টারমিডিয়েট', 'en')).toBe('Intermediate');
    expect(translateLevel('Beginner', 'bn')).toBe('বিগিনার');
  });

  it('renders LatexPlayground in English when language is toggled to en', async () => {
    const { LatexPlayground } = await import('@/components/exam/LatexPlayground');

    render(
      <LanguageProvider>
        <LanguageSetter targetLang="en">
          <LatexPlayground />
        </LanguageSetter>
      </LanguageProvider>
    );

    expect(screen.getByText('LaTeX Math Rendering Playground & Live Preview')).toBeTruthy();
    expect(screen.getByText('Select sample equation:')).toBeTruthy();
    expect(screen.getByText('Quadratic Formula')).toBeTruthy();
    expect(screen.getByText('Copy Code')).toBeTruthy();
    expect(screen.getByText('Instant Rendering')).toBeTruthy();
  });
});
