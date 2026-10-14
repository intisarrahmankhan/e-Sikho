'use client';

import React from 'react';
import { PlayCircle, AlertCircle } from 'lucide-react';

interface VideoEmbedPlayerProps {
  url?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export function parseVideoUrl(url: string) {
  if (!url) return { type: 'none', src: '' };
  const trimmed = url.trim();

  // YouTube detection
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      id: ytMatch[1],
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo detection
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Direct video file or local upload (/uploads/..., https://...mp4, blob:...)
  return {
    type: 'html5',
    src: trimmed,
  };
}

export default function VideoEmbedPlayer({
  url,
  title = 'লেকচার ভিডিও',
  className = '',
  autoPlay = false,
}: VideoEmbedPlayerProps) {
  if (!url || !url.trim()) {
    return (
      <div className={`aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-400 border border-slate-800 ${className}`}>
        <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm font-medium">কোনো ভিডিও ইউআরএল বা ফাইল পাওয়া যায়নি</p>
        <p className="text-xs text-slate-500 mt-1">ইউটিউব লিংক, ভিমিও লিংক অথবা এমপি৪ ভিডিও যোগ করুন</p>
      </div>
    );
  }

  const parsed = parseVideoUrl(url);

  if (parsed.type === 'youtube' || parsed.type === 'vimeo') {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-800 shadow-inner ${className}`}>
        <iframe
          src={parsed.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-800 shadow-inner ${className}`}>
      <video
        src={parsed.src}
        controls
        autoPlay={autoPlay}
        playsInline
        className="h-full w-full object-contain"
      >
        আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।
      </video>
    </div>
  );
}
