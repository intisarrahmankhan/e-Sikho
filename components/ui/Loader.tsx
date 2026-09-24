import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';

interface LoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Loader({
  text = 'লোড হচ্ছে...',
  subtext = 'অনুগ্রহ করে অপেক্ষা করুন',
  fullScreen = false,
  overlay = false,
  size = 'md',
}: LoaderProps) {
  const spinnerSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        {/* Glowing aura */}
        <div className="absolute h-14 w-14 rounded-full bg-primary-500/20 animate-ping pointer-events-none" />
        
        {/* Circular spinner ring */}
        <div className="relative flex items-center justify-center rounded-full bg-white p-3 shadow-md border border-slate-100">
          <Loader2 className={`${spinnerSize} animate-spin text-primary-600`} />
          <BookOpen className="absolute h-4 w-4 text-primary-700 opacity-60" />
        </div>
      </div>

      {text && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 tracking-tight">{text}</p>
          {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-8 shadow-2xl border border-slate-100 min-w-[280px]">
          {content}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-xl transition-all">
        {content}
      </div>
    );
  }

  return content;
}
