'use client';

import React, { useEffect, useState } from 'react';
import { X, Shield, Download, Lock, AlertCircle, Eye, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface ProtectedPdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  isDownloadable?: boolean;
  watermark?: {
    studentName?: string;
    studentEmail?: string;
    studentId?: string;
  };
}

export function ProtectedPdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  isDownloadable = false,
  watermark,
}: ProtectedPdfViewerModalProps) {
  const { language } = useLanguage();
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimestamp(
        new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }
  }, [isOpen, language]);

  // Anti-piracy listeners: prevent print and right-click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        alert(
          language === 'en'
            ? 'Printing and saving this document is disabled to protect instructor copyright.'
            : 'কপিরাইট সুরক্ষা নিশ্চিত করতে এই ডকুমেন্টের প্রিন্ট এবং ডাউনলোড নিষ্ক্রিয় রাখা হয়েছে।'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  // Append toolbar=0 to hide browser download / print controls in PDF viewer
  const embedSrc = `${pdfUrl}${pdfUrl.includes('#') ? '&' : '#'}toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onContextMenu={(e) => {
        if (!isDownloadable) e.preventDefault();
      }}
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-semibold truncate text-slate-100">
                {title || (language === 'en' ? 'Lecture Slides & Notes' : 'লেকচার স্লাইড ও নোটস')}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {isDownloadable ? (
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-[11px] py-0">
                    <Download className="w-3 h-3 mr-1" />
                    {language === 'en' ? 'Download Permitted' : 'ডাউনলোড অনুমোদিত'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-[11px] py-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {language === 'en' ? 'View-Only (Protected)' : 'ভিউ-অনলি (সুরক্ষিত কপি)'}
                  </Badge>
                )}
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {language === 'en'
                    ? 'Intellectual property of e-Shikho Faculty'
                    : 'ই-শিখো শিক্ষক অনুষদের মেধাসম্পদ'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDownloadable ? (
              <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 rounded-xl">
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Download PDF' : 'ডাউনলোড করুন'}</span>
                </Button>
              </a>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'en' ? 'View-Only Mode' : 'ভিউ-অনলি মোড'}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View-Only Protection Banner */}
        {!isDownloadable && (
          <div className="bg-amber-950/60 border-b border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200/90 shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Protected PDF: Download and printing are disabled to safeguard instructor intellectual property.'
                  : 'সুরক্ষিত পিডিএফ: ইন্সট্রাক্টরের মেধা সম্পদ সুরক্ষায় ডাউনলোড ও প্রিন্ট অপশন নিষ্ক্রিয় রাখা হয়েছে।'}
              </span>
            </div>
            {watermark?.studentEmail && (
              <span className="hidden md:inline font-mono text-[10px] text-amber-400/70">
                Licensed to: {watermark.studentEmail}
              </span>
            )}
          </div>
        )}

        {/* PDF Viewer Container with Dynamic Watermark Overlay */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden select-none">
          {/* Dynamic Anti-Piracy Watermark Overlay (Only in View-Only mode) */}
          {!isDownloadable && watermark && (
            <div
              className="pointer-events-none absolute inset-0 z-20 flex flex-wrap items-center justify-around opacity-15 overflow-hidden p-8"
              aria-hidden="true"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rotate-[-25deg] text-center font-mono text-xs sm:text-sm font-bold text-white tracking-widest my-8 px-6 select-none"
                >
                  <div>e-Shikho Protected DRM</div>
                  <div>{watermark.studentName || 'Student'} ({watermark.studentEmail || 'Registered'})</div>
                  <div className="text-[10px]">{timestamp}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actual PDF Viewer Frame */}
          <iframe
            src={embedSrc}
            className="w-full h-full border-0 bg-slate-900"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
