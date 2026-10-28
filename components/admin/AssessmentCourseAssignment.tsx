'use client';
import { useState } from 'react';
import { assignAssessmentCourseInstructorAction } from '@/actions/assessment-management';
export default function AssessmentCourseAssignment({ courses }: { courses: { id: string; title: string }[] }) {
  const [courseId, setCourseId] = useState(''); const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false); const [message, setMessage] = useState('');
  return <form className="mx-auto mb-8 max-w-4xl space-y-3 rounded-xl border bg-white p-5" onSubmit={async (event) => {
    event.preventDefault(); setPending(true);
    try { const result = await assignAssessmentCourseInstructorAction(courseId, email); setMessage(result.error || 'Instructor can now create assessments for this course.'); }
    catch { setMessage('The assignment could not be saved.'); } finally { setPending(false); }
  }}>
    <h2 className="font-semibold">Assign course assessment access</h2>
    <p className="text-sm text-slate-600">Grant an approved instructor permission to create exams and contests for an existing course.</p>
    <label className="block text-sm">Course<select required value={courseId} onChange={(event) => setCourseId(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Select a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
    <label className="block text-sm">Instructor email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    <button disabled={pending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">{pending ? 'Saving…' : 'Grant course access'}</button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
