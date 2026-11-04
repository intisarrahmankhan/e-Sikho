'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getSignedVideoPlaybackAction } from '@/actions/bunny-stream';

interface VideoEmbedPlayerProps {
  url?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  courseId?: string;
  lessonId?: string;
}

export function parseVideoUrl(url: string, autoPlay = false) {
  const trimmed = url.trim();
  if (!trimmed) return { type: 'none', src: '' };
  // Unsaved library references need server authorization before they can play.
  if (trimmed.startsWith('bunny:')) return { type: 'bunny', src: '', signed: false };
  if ((trimmed.startsWith('/') && !trimmed.startsWith('//')) || trimmed.startsWith('blob:')) {
    return { type: 'html5', src: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (!['https:', 'http:'].includes(parsed.protocol)) return { type: 'invalid', src: '' };
    const host = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? segments[0] : parsed.searchParams.get('v') || segments[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return { type: 'invalid', src: '' };
      return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoPlay ? 1 : 0}&rel=0` };
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      const id = host === 'player.vimeo.com' ? segments[1] : segments[0];
      if (!id || !/^\d+$/.test(id)) return { type: 'invalid', src: '' };
      const hash = parsed.searchParams.get('h') || (host !== 'player.vimeo.com' ? segments[1] : undefined);
      const target = new URL(`https://player.vimeo.com/video/${id}`);
      target.searchParams.set('autoplay', autoPlay ? '1' : '0');
      if (hash) target.searchParams.set('h', hash);
      return { type: 'vimeo', src: target.toString() };
    }
    if (['iframe.mediadelivery.net', 'player.mediadelivery.net', 'video.bunnycdn.com'].includes(host)) {
      parsed.searchParams.set('autoplay', String(autoPlay));
      return { type: 'bunny', src: parsed.toString(), signed: !!parsed.searchParams.get('token') && !!parsed.searchParams.get('expires') };
    }
    return { type: 'html5', src: trimmed };
  } catch {
    return { type: 'invalid', src: '' };
  }
}

export default function VideoEmbedPlayer({ url = '', title = 'লেকচার ভিডিও', className = '', autoPlay = false, courseId, lessonId }: VideoEmbedPlayerProps) {
  const parsed = parseVideoUrl(url, autoPlay);
  const requestKey = parsed.type === 'bunny' && courseId && lessonId ? `${courseId}:${lessonId}:${url}` : '';
  const [playback, setPlayback] = useState<{ key: string; url?: string; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const [failedSource, setFailedSource] = useState('');

  useEffect(() => {
    if (!requestKey || !courseId || !lessonId) return;
    let cancelled = false;
    setPlayback(undefined);
    getSignedVideoPlaybackAction(courseId, lessonId).then((result) => {
      if (!cancelled) setPlayback({ key: requestKey, url: result.success ? result.playbackUrl : undefined, error: result.error || (!result.playbackUrl ? 'Video preview could not be loaded.' : undefined) });
    }).catch(() => {
      if (!cancelled) setPlayback({ key: requestKey, error: 'Video preview could not be loaded. Please retry.' });
    });
    return () => { cancelled = true; };
  }, [requestKey, courseId, lessonId, attempt]);

  const currentPlayback = playback?.key === requestKey ? playback : undefined;
  const loading = !!requestKey && !currentPlayback;
  let message = parsed.type === 'none' ? 'কোনো ভিডিও ইউআরএল বা ফাইল পাওয়া যায়নি' : parsed.type === 'invalid' ? 'Please enter a valid video URL.' : '';
  if (parsed.type === 'bunny') {
    if (requestKey) message = currentPlayback?.error || '';
    else if (!parsed.signed) message = 'Save this lecture, then open Preview to watch the protected video. New uploads must finish processing first.';
  }
  const src = requestKey ? (currentPlayback?.url ? parseVideoUrl(currentPlayback.url, autoPlay).src : '') : parsed.src;

  if (loading || message || (failedSource === src && !!src)) {
    return (
      <div role="status" className={`aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-300 border border-slate-800 ${className}`}>
        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <AlertCircle className="h-8 w-8 text-slate-400" />}
        <p className="text-sm font-medium">{loading ? 'Loading secure preview…' : message || 'This video could not be played. Check the file format or video URL.'}</p>
        {currentPlayback?.error && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="rounded-lg border border-slate-600 px-3 py-1 text-sm">Retry</button>}
      </div>
    );
  }

  return (
    <div onContextMenu={(event) => event.preventDefault()} className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-800 shadow-inner ${className}`}>
      {['bunny', 'youtube', 'vimeo'].includes(parsed.type) ? (
        <iframe key={src} src={src} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
      ) : (
        <video key={src} src={src} controls controlsList="nodownload" onError={() => setFailedSource(src)} autoPlay={autoPlay} playsInline preload="metadata" className="h-full w-full object-contain">
          আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।
        </video>
      )}
    </div>
  );
}
