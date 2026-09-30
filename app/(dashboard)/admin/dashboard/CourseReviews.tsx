'use client';
import { useState } from 'react';
import { reviewCourse } from '../actions';

export default function CourseReviews({ courses }: { courses: { id: string; title: string; description: string; price: number; instructor: { name: string } }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!courses.length) return <p className="text-sm text-gray-500">No courses are waiting for review.</p>;
  return <div className="space-y-3">{courses.map(course => <div key={course.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-gray-900">{course.title}</p><p className="text-xs text-gray-500">By {course.instructor.name} · {course.price === 0 ? 'Free' : `৳${course.price}`}</p><p className="mt-2 text-sm text-gray-600">{course.description}</p></div><div className="flex gap-2"><button disabled={busy === course.id} onClick={async () => { setBusy(course.id); await reviewCourse(course.id, 'APPROVE'); setBusy(null); }} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button><button disabled={busy === course.id} onClick={async () => { setBusy(course.id); await reviewCourse(course.id, 'REJECT'); setBusy(null); }} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></div></div></div>)}</div>;
}
