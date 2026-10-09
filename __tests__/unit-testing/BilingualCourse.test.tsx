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
});
