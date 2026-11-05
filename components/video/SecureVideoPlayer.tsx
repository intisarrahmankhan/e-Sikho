'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  PlayCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Gauge,
  Check,
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

const PLAYBACK_SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

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
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [resumeNotice, setResumeNotice] = useState<{ show: boolean; time: number }>({ show: false, time: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const storageKey = `esikho_last_pos_${courseId}_${lessonId}`;

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

  // 2. Check LocalStorage for playback resume position
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const time = parseFloat(saved);
        if (Number.isFinite(time) && time > 5) {
          setResumeNotice({ show: true, time });
        }
      }
    } catch {
      // localStorage may be disabled
    }
  }, [storageKey]);

  // 3. Randomized dynamic floating watermark to deter screen-recording piracy
  useEffect(() => {
    const interval = setInterval(() => {
      const topPct = Math.floor(Math.random() * 70 + 10);
      const leftPct = Math.floor(Math.random() * 65 + 10);
      setWatermarkPos({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Set playback speed on HTML5 video or Bunny iframe
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'setPlaybackRate', value: speed }),
          '*'
        );
      } catch {
        // cross-origin iframe
      }
    }
  };

  const resumePlayback = () => {
    if (videoRef.current && resumeNotice.time > 0) {
      videoRef.current.currentTime = resumeNotice.time;
    }
    setResumeNotice({ show: false, time: 0 });
  };

  const recordProgress = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    // Save to LocalStorage for resume
    if (video.currentTime > 2) {
      try {
        localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
      } catch {
        // ignore storage errors
      }
    }

    if (!video.ended && Math.floor(video.currentTime) % 10 !== 0) return;
    void trackLessonHeartbeatAction({
      courseId,
      lessonId,
      currentTimestamp: video.currentTime,
      videoDuration: video.duration,
    });
  };

  if (loading) {
    return (
      <div
        className={`aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-white border border-slate-800 shadow-xl ${className}`}
      >
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide text-slate-200">
          ভিডিও প্রস্তুত হচ্ছে…
        </p>
        <p className="text-xs text-slate-500 mt-1">
          ভিডিও অ্যাক্সেস যাচাই করা হচ্ছে
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

  const playerContainer = (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full overflow-hidden bg-black select-none group ${
        isTheaterMode
          ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col justify-center'
          : `aspect-video rounded-2xl border border-slate-800 shadow-2xl ${className}`
      }`}
    >
      {/* ── Active Video Player ── */}
      {videoType === 'bunny' ? (
        <iframe
          ref={iframeRef}
          src={playbackUrl}
          title={title || initialTitle || 'সুরক্ষিত ভিডিও ক্লাস'}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0 pointer-events-auto"
        />
      ) : videoType === 'youtube' || videoType === 'vimeo' ? (
        <iframe
          ref={iframeRef}
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
          ref={videoRef}
          src={playbackUrl}
          controls
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={recordProgress}
          onEnded={recordProgress}
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

      {/* ── Resume playback prompt notification ── */}
      {resumeNotice.show && (
        <div className="absolute bottom-14 left-4 z-30 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 px-4 py-2 rounded-xl text-xs flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
          <RotateCcw className="h-4 w-4 text-primary-400" />
          <span>Resume from {Math.floor(resumeNotice.time / 60)}:{String(Math.floor(resumeNotice.time % 60)).padStart(2, '0')}?</span>
          <button
            onClick={resumePlayback}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
          >
            Resume
          </button>
          <button
            onClick={() => setResumeNotice({ show: false, time: 0 })}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Top-right Overlay Controls (Speed toggles, Theater mode, Security pill) ── */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Playback Speed Toggles */}
        <div className="flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2 py-1 shadow-md text-white text-[11px] font-medium">
          <Gauge className="h-3 w-3 text-slate-400 ml-0.5" />
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                playbackSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Theater Mode Toggle */}
        <button
          onClick={() => setIsTheaterMode(!isTheaterMode)}
          className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white hover:bg-slate-800 transition shadow-md"
          title={isTheaterMode ? 'Exit theater mode' : 'Theater mode'}
          aria-label={isTheaterMode ? 'Exit theater mode' : 'Theater mode'}
        >
          {isTheaterMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {/* Security Pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/20 shadow-md">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>{videoType === 'bunny' ? 'DRM signed' : 'Verified stream'}</span>
        </div>
      </div>
    </div>
  );

  return playerContainer;
}
