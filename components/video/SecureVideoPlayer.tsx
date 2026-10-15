'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  PlayCircle,
  Eye,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { getSignedVideoPlaybackAction, SignedPlaybackResult } from '@/actions/bunny-stream';
import { trackLessonHeartbeatAction } from '@/actions/course-access';

interface SecureVideoPlayerProps {
  courseId: string;
  lessonId: string;
  initialTitle?: string;
  onLocked?: () => void;
  className?: string;
}

export default function SecureVideoPlayer({
  courseId,
  lessonId,
  initialTitle,
  onLocked,
  className = '',
}: SecureVideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SignedPlaybackResult | null>(null);
  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '20%' });

  // 1. Fetch time-limited signed DRM playback token and watermark
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadStream() {
      try {
        const res = await getSignedVideoPlaybackAction(courseId, lessonId);
        if (isMounted) {
          setData(res);
          if (res.isLocked && onLocked) {
            onLocked();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setData({
            success: false,
            error: err.message || 'সুরক্ষিত ভিডিও স্ট্রিম লোড করতে ত্রুটি হয়েছে।',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (courseId && lessonId) {
      loadStream();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId, onLocked]);

  // 2. Randomized dynamic floating watermark to deter screen-recording piracy
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random percentage positions
      const topPct = Math.floor(Math.random() * 70 + 10);
      const leftPct = Math.floor(Math.random() * 65 + 10);
      setWatermarkPos({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // 3. Track video playback heartbeat and drop-off timestamps for instructor analytics
  useEffect(() => {
    if (!courseId || !lessonId || !data?.success) return;

    let secondsElapsed = 0;
    const durSec = 720;
    const interval = setInterval(() => {
      secondsElapsed += 10;
      trackLessonHeartbeatAction({
        courseId,
        lessonId,
        currentTimestamp: secondsElapsed,
        videoDuration: durSec,
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [courseId, lessonId, data?.success]);

  if (loading) {
    return (
      <div
        className={`aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-white border border-slate-800 shadow-xl ${className}`}
      >
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide text-slate-200">
          ডিআরএম এনক্রিপ্টেড স্ট্রিম প্রস্তুত হচ্ছে…
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Bunny.net সুরক্ষিত কী এবং স্টুডেন্ট ওয়াটারমার্ক সিঙ্ক করা হচ্ছে
        </p>
      </div>
    );
  }

  if (!data?.success || !data.playbackUrl) {
    return (
      <div
        className={`aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white border border-slate-800 shadow-xl ${className}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-3 border border-rose-500/20">
          {data?.isLocked ? <Lock className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
        </div>
        <h4 className="text-base font-bold text-slate-100">
          {data?.isLocked ? 'লেকচারটি সংরক্ষিত / লক করা' : 'ভিডিও প্লেব্যাক ত্রুটি'}
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {data?.error || 'এই ভিডিও ক্লাসটি দেখতে কোর্সটিতে ভর্তি নিশ্চিত করুন।'}
        </p>
      </div>
    );
  }

  const { playbackUrl, videoType, watermark, title } = data;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl select-none group ${className}`}
    >
      {/* ── Active Video Player ── */}
      {videoType === 'bunny' ? (
        <iframe
          src={playbackUrl}
          title={title || initialTitle || ' সুরক্ষিত ভিডিও ক্লাস'}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0 pointer-events-auto"
        />
      ) : videoType === 'youtube' || videoType === 'vimeo' ? (
        <iframe
          src={
            playbackUrl.includes('?')
              ? `${playbackUrl}&autoplay=1&rel=0`
              : `${playbackUrl}?autoplay=1&rel=0`
          }
          title={title || initialTitle || 'ভিডিও ক্লাস'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <video
          src={playbackUrl}
          controls
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        >
          আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।
        </video>
      )}

      {/* ── Dynamic Anti-Piracy Student Watermark Overlay ── */}
      {watermark && (
        <div
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
          className="pointer-events-none absolute z-30 transition-all duration-1000 ease-in-out opacity-25 select-none"
        >
          <div className="flex flex-col items-start bg-black/40 backdrop-blur-[2px] px-2.5 py-1 rounded-md text-[10px] font-mono tracking-tighter text-white border border-white/10 shadow-sm">
            <span>{watermark.studentEmail}</span>
            <span className="text-[9px] text-slate-400">ID: {watermark.studentId} • {watermark.timestamp}</span>
          </div>
        </div>
      )}

      {/* ── Security Status Header Pill ── */}
      <div className="pointer-events-none absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/20 shadow-md">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>DRM এনক্রিপ্টেড স্ট্রিমিং</span>
        </div>
      </div>
    </div>
  );
}
