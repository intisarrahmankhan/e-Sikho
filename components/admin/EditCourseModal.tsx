'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X, Loader2, DollarSign, Image, User, Layers } from 'lucide-react';
import { updateCourseByAdmin } from '@/actions/admin';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course: {
    id: string;
    title: string;
    titleEn?: string;
    tagline?: string;
    taglineEn?: string;
    description: string;
    category: string;
    categoryBangla?: string;
    level: string;
    price: number;
    originalPrice?: number;
    duration?: string;
    thumbnailUrl?: string;
    instructorName?: string;
    status: string;
    approvalStatus?: string;
  } | null;
}

export default function EditCourseModal({ isOpen, onClose, onSuccess, course }: EditCourseModalProps) {
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('web-dev');
  const [categoryBangla, setCategoryBangla] = useState('ওয়েব ডেভেলপমেন্ট');
  const [level, setLevel] = useState('বিগিনার');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [duration, setDuration] = useState('২০ ঘণ্টা');
  const [instructorName, setInstructorName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED'>('PUBLISHED');
  const [approvalStatus, setApprovalStatus] = useState('APPROVED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    { id: 'web-dev', bangla: 'ওয়েব ডেভেলপমেন্ট' },
    { id: 'data-science', bangla: 'ডাটা সায়েন্স ও এআই' },
    { id: 'programming', bangla: 'প্রোগ্রামিং ও ডিএসএ' },
    { id: 'system-design', bangla: 'সিস্টেম ডিজাইন' },
    { id: 'app-dev', bangla: 'অ্যাপ ডেভেলপমেন্ট' },
  ];

  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setTitleEn(course.titleEn || '');
      setTagline(course.tagline || '');
      setCategory(course.category || 'web-dev');
      setCategoryBangla(course.categoryBangla || 'ওয়েব ডেভেলপমেন্ট');
      setLevel(course.level || 'বিগিনার');
      setPrice(course.price || 0);
      setOriginalPrice(course.originalPrice || course.price || 0);
      setDuration(course.duration || '২০ ঘণ্টা');
      setInstructorName(course.instructorName || '');
      setDescription(course.description || '');
      setThumbnailUrl(course.thumbnailUrl || '');
      setStatus((course.status as any) || 'PUBLISHED');
      setApprovalStatus(course.approvalStatus || 'APPROVED');
      setError(null);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const matched = categoryOptions.find(c => c.id === catId);
    if (matched) setCategoryBangla(matched.bangla);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateCourseByAdmin(course.id, {
        title,
        titleEn: titleEn.trim() || undefined,
        tagline: tagline.trim() || undefined,
        category,
        categoryBangla,
        level,
        price: Number(price) || 0,
        originalPrice: Number(originalPrice) || Number(price) || 0,
        duration: duration.trim() || undefined,
        instructorName: instructorName.trim() || undefined,
        description,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        status,
        approvalStatus,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update course.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Course</h2>
              <p className="text-xs text-gray-500">Update course content, pricing, and publication status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Course Title (বাংলা) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Title in English
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tagline / Short Summary</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.bangla}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
              >
                <option value="বিগিনার">বিগিনার</option>
                <option value="ইন্টারমিডিয়েট">ইন্টারমিডিয়েট</option>
                <option value="অ্যাডভান্সড">অ্যাডভান্সড</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
              >
                <option value="PUBLISHED">PUBLISHED (লাইভ)</option>
                <option value="DRAFT">DRAFT (খসড়া)</option>
                <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price (৳)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Original Price (৳)</label>
              <input
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. ২৫ ঘণ্টা"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Instructor Name</label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Thumbnail URL</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Course Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
