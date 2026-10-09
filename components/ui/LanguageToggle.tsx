'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-0.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <div className="pl-1.5 pr-1 text-slate-400">
        <Globe className="h-3.5 w-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
          language === 'bn'
            ? 'bg-white text-primary-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="বাংলায় পরিবর্তন করুন"
      >
        বাং
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white text-primary-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
