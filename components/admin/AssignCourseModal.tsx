'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  BookOpen,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import {
  assignCourseToStudent,
  removeCourseFromStudent,
  getStudentEnrollments,
  getAllAssignableCourses,
} from '@/actions/admin';

interface AssignCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface EnrolledCourse {
  courseId: string;
  title: string;
  titleEn?: string;
  enrolledAt: string | Date;
  paymentStatus: string;
}

interface AvailableCourse {
  id: string;
  title: string;
  titleEn?: string;
  price: number;
  category: string;
}

export default function AssignCourseModal({
  isOpen,
  onClose,
  student,
}: AssignCourseModalProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!student) return;
    setLoadingData(true);
    setFeedback(null);
    try {
      const [enrollmentRes, coursesRes] = await Promise.all([
        getStudentEnrollments(student.id),
        getAllAssignableCourses(),
      ]);

      if (enrollmentRes.success && enrollmentRes.enrollments) {
        setEnrolledCourses(enrollmentRes.enrollments as EnrolledCourse[]);
      }
      if (coursesRes.success && coursesRes.courses) {
        setAvailableCourses(coursesRes.courses as AvailableCourse[]);
        if (coursesRes.courses.length > 0) {
          setSelectedCourseId(coursesRes.courses[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error loading course data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [student]);

  useEffect(() => {
    if (isOpen && student) {
      loadData();
    } else {
      setFeedback(null);
      setSelectedCourseId('');
    }
  }, [isOpen, student, loadData]);

  if (!isOpen || !student) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await assignCourseToStudent(student.id, selectedCourseId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Course assigned successfully!' });
        // Reload enrollments
        const updateRes = await getStudentEnrollments(student.id);
        if (updateRes.success && updateRes.enrollments) {
          setEnrolledCourses(updateRes.enrollments as EnrolledCourse[]);
        }
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to assign course.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error assigning course.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (courseId: string) => {
    if (!confirm('Are you sure you want to remove this student enrollment?')) return;

    setRevokeLoadingId(courseId);
    setFeedback(null);
    try {
      const res = await removeCourseFromStudent(student.id, courseId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Course enrollment revoked.' });
        setEnrolledCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to revoke course.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error revoking course.' });
    } finally {
      setRevokeLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Assign Course to Student</h3>
              <p className="text-xs text-gray-500">SuperAdmin Direct Enrollment Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Student Profile Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Student</span>
              <h4 className="text-sm font-bold text-gray-900">{student.name}</h4>
              <p className="text-xs text-gray-600">{student.email}</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
              {student.role}
            </span>
          </div>

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

          {/* Enrolled Courses Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                Active Enrolled Courses ({enrolledCourses.length})
              </h4>
            </div>

            {loadingData ? (
              <div className="py-6 flex justify-center items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                Loading student enrollments...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                This student is not enrolled in any course yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden bg-white max-h-44 overflow-y-auto">
                {enrolledCourses.map((c) => (
                  <div key={c.courseId} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.title}</p>
                      <p className="text-[10px] text-gray-400">
                        Status: <span className="font-semibold text-emerald-600 uppercase">{c.paymentStatus}</span> · Enrolled: {new Date(c.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      disabled={revokeLoadingId === c.courseId}
                      onClick={() => handleRevoke(c.courseId)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition disabled:opacity-50"
                      title="Revoke enrollment"
                    >
                      {revokeLoadingId === c.courseId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Course Form */}
          <form onSubmit={handleAssign} className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
              Assign a New Course
            </h4>

            <div className="space-y-1.5">
              <label htmlFor="course-select" className="block text-xs font-medium text-gray-600">
                Select Course to Grant:
              </label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={loadingData || actionLoading || availableCourses.length === 0}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} — {course.category} (৳{course.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loadingData || actionLoading || !selectedCourseId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Confirm & Assign Course
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
