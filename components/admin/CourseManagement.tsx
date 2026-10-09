'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BookPlus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getAllAdminCourses,
  deleteCourseByAdmin,
  syncCatalogCoursesToDb,
} from '@/actions/admin';
import AddCourseModal from '@/components/admin/AddCourseModal';
import EditCourseModal from '@/components/admin/EditCourseModal';
import DeleteCourseConfirmModal from '@/components/admin/DeleteCourseConfirmModal';
import Link from 'next/link';

interface CourseItem {
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
  status: string;
  approvalStatus?: string;
  studentsEnrolled: number;
  instructorName?: string;
  createdAt?: string;
}

interface CourseManagementProps {
  isSuperadmin?: boolean;
}

export default function CourseManagement({ isSuperadmin = true }: CourseManagementProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getAllAdminCourses();
      if (res.success && res.courses) {
        setCourses(res.courses as CourseItem[]);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncCatalogCoursesToDb();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Courses synced successfully!' });
        fetchCourses();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to sync catalog courses.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to sync catalog.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await deleteCourseByAdmin(deletingCourse.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Course deleted successfully.' });
        setDeletingCourse(null);
        fetchCourses();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete course.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error deleting course.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      (c.titleEn && c.titleEn.toLowerCase().includes(q)) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'ALL' || c.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' || c.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 text-xs rounded-xl font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header controls: Search, Filters, Add Course, Sync */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
          >
            <option value="ALL">All Categories (সব বিষয়)</option>
            <option value="web-dev">Web Development</option>
            <option value="data-science">Data Science & AI</option>
            <option value="programming">Programming & DSA</option>
            <option value="system-design">System Design</option>
            <option value="app-dev">App Development</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published (লাইভ)</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {isSuperadmin && (
            <>
              <button
                type="button"
                onClick={handleSyncCatalog}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm"
                title="Sync default catalog courses into MongoDB"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-violet-600' : 'text-gray-500'}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 transition shadow-sm shrink-0"
              >
                <BookPlus className="h-3.5 w-3.5" />
                <span>Add New Course</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Courses Table */}
      <div className="overflow-x-auto relative rounded-xl border border-gray-200 bg-white">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 min-h-[160px]">
            <span className="flex items-center gap-2 text-violet-600 font-semibold text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading courses...
            </span>
          </div>
        )}

        <table className="w-full text-left text-sm text-gray-600 min-h-[160px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-gray-700 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold">Course</th>
              <th className="px-4 py-3 font-bold">Category</th>
              <th className="px-4 py-3 font-bold">Instructor</th>
              <th className="px-4 py-3 font-bold">Price</th>
              <th className="px-4 py-3 font-bold">Students</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 text-right font-bold">Course Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-xs text-gray-500">
                  No courses found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => {
                const isPublished = course.status === 'PUBLISHED';
                const isDraft = course.status === 'DRAFT';
                const isPending = course.status === 'PENDING_REVIEW';

                return (
                  <tr key={course.id} className="hover:bg-slate-50/70 transition">
                    {/* Course Title & Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-10 w-16 rounded-lg object-cover shrink-0 border border-gray-200 shadow-xs"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 border border-violet-200 font-bold text-xs">
                            Course
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 text-sm leading-tight hover:text-violet-700 transition">
                            {course.title}
                          </div>
                          {course.titleEn && (
                            <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                              {course.titleEn}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Level: <span className="font-semibold text-gray-600">{course.level}</span>
                            {course.duration && <> · {course.duration}</>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {course.categoryBangla || course.category}
                      </span>
                    </td>

                    {/* Instructor */}
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                      {course.instructorName || 'e-Shikho Faculty'}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-sm text-gray-900">
                        ৳{course.price.toLocaleString()}
                      </div>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="text-[10px] text-gray-400 line-through">
                          ৳{course.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Students */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <Users className="h-3 w-3 text-gray-400" />
                        {course.studentsEnrolled || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] rounded-full font-bold border ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDraft
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview Course Link */}
                        <Link
                          href={`/courses/${course.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                          title="Preview public course page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>

                        {/* Edit Course Button */}
                        {isSuperadmin && (
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200"
                            title="Edit course details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}

                        {/* Delete Course Button */}
                        {isSuperadmin && (
                          <button
                            onClick={() => setDeletingCourse(course)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg transition bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                            title="Delete course permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Course Modals */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setFeedback({ type: 'success', message: 'Course created and published successfully!' });
          fetchCourses();
        }}
      />

      <EditCourseModal
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        onSuccess={() => {
          setFeedback({ type: 'success', message: 'Course updated successfully!' });
          fetchCourses();
        }}
        course={editingCourse}
      />

      <DeleteCourseConfirmModal
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        course={deletingCourse}
        isLoading={isDeleting}
      />
    </div>
  );
}
