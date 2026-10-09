import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

function TestConsumer() {
  const { language, toggleLanguage, setLanguage, t } = useLanguage();

  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="translated-home">{t('nav.home')}</span>
      <span data-testid="translated-courses">{t('nav.courses')}</span>
      <span data-testid="translated-fallback">{t('non.existent.key', 'Fallback Text')}</span>
      <button onClick={toggleLanguage} data-testid="toggle-btn">
        Toggle Lang
      </button>
      <button onClick={() => setLanguage('en')} data-testid="set-en-btn">
        Direct EN
      </button>
      <button onClick={() => setLanguage('bn')} data-testid="set-bn-btn">
        Direct BN
      </button>
      <LanguageToggle />
    </div>
  );
}

describe('LanguageContext and LanguageToggle', () => {
  it('defaults to Bangla (bn) and translates navigation keys', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('bn');
    expect(screen.getByTestId('translated-home').textContent).toBe('হোম');
    expect(screen.getByTestId('translated-courses').textContent).toBe('সকল কোর্স');
    expect(screen.getByTestId('translated-fallback').textContent).toBe('Fallback Text');
  });

  it('switches to English when toggled and updates translations', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');
    expect(screen.getByTestId('translated-courses').textContent).toBe('All Courses');
  });

  it('switches language using setLanguage directly and via LanguageToggle component', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    // Click EN button on LanguageToggle
    const enButton = screen.getByTitle('Switch to English');
    fireEvent.click(enButton);
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');

    // Click বাং button on LanguageToggle
    const bnButton = screen.getByTitle('বাংলায় পরিবর্তন করুন');
    fireEvent.click(bnButton);
    expect(screen.getByTestId('current-lang').textContent).toBe('bn');
    expect(screen.getByTestId('translated-home').textContent).toBe('হোম');

    // Test direct setLanguage
    const directEnBtn = screen.getByTestId('set-en-btn');
    fireEvent.click(directEnBtn);
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
  });
});
