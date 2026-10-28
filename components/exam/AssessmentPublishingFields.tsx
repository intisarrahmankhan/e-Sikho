'use client';
import Link from 'next/link';
import { AssessmentAudience, AssessmentKind } from '@/lib/assessment-policy';
import AssessmentAudienceFields from './AssessmentAudienceFields';

export default function AssessmentPublishingFields({ courses, canCreateGlobal, kind, scope, onScopeChange, courseId, onCourseChange, audience, onAudienceChange }: {
  courses: { id: string; title: string; status?: string }[]; canCreateGlobal: boolean; kind: AssessmentKind;
  scope: 'COURSE' | 'GLOBAL'; onScopeChange: (scope: 'COURSE' | 'GLOBAL') => void;
  courseId: string; onCourseChange: (id: string) => void; audience: AssessmentAudience; onAudienceChange: (audience: AssessmentAudience) => void;
}) {
  return <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
    <label className="block text-sm font-semibold">Assessment scope
      <select value={scope} onChange={(event) => onScopeChange(event.target.value as 'COURSE' | 'GLOBAL')} className="mt-1 w-full rounded-lg border p-2 text-sm">
        <option value="COURSE">Course assessment</option><option value="GLOBAL" disabled={!canCreateGlobal}>Global assessment{!canCreateGlobal ? ' — approval required' : ''}</option>
      </select>
    </label>
    {!canCreateGlobal && <p className="text-xs text-slate-600">Global hosting requires superadmin approval. <Link href="/instructor/assessments" className="font-semibold text-primary-700 underline">Apply or check your application</Link>.</p>}
    {scope === 'COURSE' ? <>
      <label className="block text-sm font-semibold">Course
        <select required value={courseId === 'none' ? '' : courseId} onChange={(event) => onCourseChange(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm">
          <option value="">Select a course you teach</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}{course.status && course.status !== 'PUBLISHED' ? ` (${course.status.replaceAll('_', ' ')})` : ''}</option>)}
        </select>
      </label>
      <p className="text-xs text-slate-500">Your created and assigned courses are listed, including drafts. Students can participate after the course is published and their enrollment is active.</p>
      {!courses.length && <p className="text-sm text-amber-700">No courses are assigned to you yet. Create a course or ask an administrator to assign instructor access.</p>}
    </> : <AssessmentAudienceFields kind={kind} value={audience} onChange={onAudienceChange} />}
  </div>;
}
