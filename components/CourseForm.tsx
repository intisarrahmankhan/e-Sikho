'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { createCourse } from '@/actions/instructor';
import {
  PlusCircle,
  Loader2,
  UploadCloud,
  Video,
  CheckCircle2,
  XCircle,
  Play,
  Film,
  Sparkles,
  Info
} from 'lucide-react';

interface CourseFormProps {
  onSuccess?: () => void;
}

export default function CourseForm({ onSuccess }: CourseFormProps) {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Cloudflare R2 Upload states for Lesson Video
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);
  const [lessonUploadProgress, setLessonUploadProgress] = useState(0);

  // Cloudflare R2 Upload states for Course Preview Video
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [uploadingPreviewVideo, setUploadingPreviewVideo] = useState(false);
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);

  // Handle direct file upload to Cloudflare R2 via API
  async function uploadFileToR2(
    file: File,
    setUrl: (url: string) => void,
    setUploading: (u: boolean) => void,
    setProgress: React.Dispatch<React.SetStateAction<number>>
  ) {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress ping
      const interval = setInterval(() => {
        setProgress((prev: number) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const response = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload video to Cloudflare R2');
      }

      setProgress(100);
      setUrl(data.videoUrl);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleLessonVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileToR2(
        file,
        setLessonVideoUrl,
        setUploadingLessonVideo,
        setLessonUploadProgress
      );
    }
  }

  async function handlePreviewVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileToR2(
        file,
        setPreviewVideoUrl,
        setUploadingPreviewVideo,
        setPreviewUploadProgress
      );
    }
  }

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');

    // Attach pre-uploaded video URLs if available
    if (lessonVideoUrl) formData.set('videoUrl', lessonVideoUrl);
    if (previewVideoUrl) formData.set('previewVideoUrl', previewVideoUrl);

    const result = await createCourse(formData);
    if (result.error) {
      setIsError(true);
      setMessage(result.error);
    } else {
      setIsError(false);
      setMessage('✓ Course successfully submitted for admin review!');
      formRef.current?.reset();
      setLessonVideoUrl('');
      setPreviewVideoUrl('');
      onSuccess?.();
    }
    setPending(false);
  }

  return (
    <form ref={formRef} action={submit} className="space-y-6">

      {/* Cloudflare Banner */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 text-xs text-orange-900">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-xs">
          R2
        </div>
        <div>
          <p className="font-semibold text-orange-950">Cloudflare R2 Video Storage Active</p>
          <p className="text-orange-800">
            Upload high-definition lesson videos directly to ultra-fast Cloudflare R2 cloud storage.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">

        {/* Course Title */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Course Title *
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Complete Fullstack Web Development in 2026"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Tagline */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Short Tagline
          </label>
          <input
            name="tagline"
            placeholder="One line to catch student attention..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Course Description *
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Comprehensive description of what students will master..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Category *
          </label>
          <input
            name="category"
            required
            placeholder="e.g. Web Development"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Level */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Level</label>
          <select
            name="level"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition bg-white"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Duration</label>
          <input
            name="duration"
            placeholder="e.g. 15 hours"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Price */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Price (BDT) — 0 for Free
          </label>
          <input
            name="price"
            type="number"
            min="0"
            defaultValue="0"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Thumbnail */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Course Thumbnail Image
          </label>
          <input
            name="thumbnail"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
          />
        </div>

        {/* Course Preview Video (Cloudflare R2) */}
        <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-indigo-600" />
              <label className="text-sm font-bold text-slate-800">
                Course Preview Video (Cloudflare R2)
              </label>
            </div>
            <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              Cloudflare R2
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 items-center">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Upload Video File (.mp4, .webm, .mov)
              </label>
              <input
                type="file"
                accept="video/*"
                disabled={uploadingPreviewVideo}
                onChange={handlePreviewVideoChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-orange-500 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-orange-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Or Paste Video URL
              </label>
              <input
                name="previewVideoUrl"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://pub-....r2.dev/videos/..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {uploadingPreviewVideo && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-indigo-600 font-semibold">
                <span>Uploading preview video to Cloudflare R2...</span>
                <span>{previewUploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${previewUploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Video Preview Player */}
          {previewVideoUrl && (
            <div className="mt-2 rounded-xl overflow-hidden bg-black border border-slate-300">
              <div className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Play className="h-3 w-3 text-orange-400" /> R2 Preview Player
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewVideoUrl('')}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <video src={previewVideoUrl} controls className="w-full max-h-48 object-contain" />
            </div>
          )}
        </div>

        {/* First Module & Lesson Section */}
        <div className="sm:col-span-2 border-t border-slate-200 pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              First Module & Lesson Setup
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Module Title *
              </label>
              <input
                name="moduleTitle"
                required
                defaultValue="Module 1: Introduction & Fundamentals"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                First Lesson Title *
              </label>
              <input
                name="lessonTitle"
                required
                placeholder="e.g. 1.1 Course Overview & Environment Setup"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Lesson Text / Notes *
            </label>
            <textarea
              name="lessonContent"
              required
              rows={3}
              placeholder="Lesson outline, code snippets, or notes..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Lesson Video Upload (Cloudflare R2) */}
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-600" />
                <label className="text-sm font-bold text-indigo-950">
                  Lesson Video Upload (Cloudflare R2) *
                </label>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                Cloudflare R2 Enabled
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 items-center">
              <div>
                <label className="block text-xs text-indigo-900 mb-1 font-medium">
                  Select Video File (.mp4, .webm, .mov)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploadingLessonVideo}
                  onChange={handleLessonVideoChange}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-indigo-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-indigo-900 mb-1 font-medium">
                  Or Direct R2 Video URL
                </label>
                <input
                  name="videoUrl"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://pub-....r2.dev/videos/..."
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Progress Bar */}
            {uploadingLessonVideo && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-indigo-700 font-semibold">
                  <span>Uploading video to Cloudflare R2...</span>
                  <span>{lessonUploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-indigo-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${lessonUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Lesson Video Preview Player */}
            {lessonVideoUrl && (
              <div className="mt-2 rounded-xl overflow-hidden bg-black border border-indigo-300">
                <div className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Lesson Video Ready (R2 Cloud)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLessonVideoUrl('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                <video src={lessonVideoUrl} controls className="w-full max-h-52 object-contain" />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending || uploadingLessonVideo || uploadingPreviewVideo}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Submitting Course...</>
        ) : (
          <><PlusCircle className="h-5 w-5" /> Submit Course for Admin Review</>
        )}
      </button>

      {message && (
        <p className={`rounded-xl p-4 text-sm font-semibold ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
