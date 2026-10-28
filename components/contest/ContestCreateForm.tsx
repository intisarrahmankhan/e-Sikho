'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentPublishingFields from '@/components/exam/AssessmentPublishingFields';
import { AssessmentAudience, emptyAudience } from '@/lib/assessment-policy';
import { createContestAction } from '@/actions/contest';

const blankProblem = () => ({ title: '', statement: '', options: ['', '', '', ''], correctAnswer: 0, points: 100, explanation: '' });
export default function ContestCreateForm({ courses, canCreateGlobal }: { courses: { id: string; title: string; status?: string }[]; canCreateGlobal: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'COURSE' | 'GLOBAL'>('COURSE');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [audience, setAudience] = useState<AssessmentAudience>(emptyAudience);
  const [startTime, setStartTime] = useState(''); const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [problems, setProblems] = useState([blankProblem()]);
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const update = (index: number, change: Partial<ReturnType<typeof blankProblem>>) => setProblems((previous) => previous.map((problem, i) => i === index ? { ...problem, ...change } : problem));
  return <form className="mx-auto max-w-4xl space-y-6 pb-12" onSubmit={async (event) => {
    event.preventDefault(); setPending(true); setError('');
    try {
      const result = await createContestAction({ title, description, scope, courseId: scope === 'COURSE' ? courseId : undefined, audience, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), durationMinutes, problems });
      if (result.error) setError(result.error); else router.push(`/contests/${result.slug}`);
    } catch { setError('The contest could not be published. Please try again.'); } finally { setPending(false); }
  }}>
    <h1 className="text-2xl font-bold">Create a contest</h1>
    <AssessmentPublishingFields courses={courses} canCreateGlobal={canCreateGlobal} kind="CONTEST" scope={scope} onScopeChange={setScope} courseId={courseId} onCourseChange={setCourseId} audience={audience} onAudienceChange={setAudience} />
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <label className="block text-sm font-semibold">Contest title<input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-semibold">Description and participation instructions<textarea required value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border p-2" rows={3} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Starts (your local time)<input required type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Ends (your local time)<input required type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Duration (minutes)<input required type="number" min={1} max={480} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
      </div>
    </div>
    {problems.map((problem, index) => <fieldset key={index} className="space-y-3 rounded-xl border bg-white p-5">
      <legend className="px-1 font-semibold">Problem {index + 1}</legend>
      <label className="block text-sm">Title<input required value={problem.title} onChange={(event) => update(index, { title: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">Question (LaTeX supported)<textarea required value={problem.statement} onChange={(event) => update(index, { statement: event.target.value })} className="mt-1 w-full rounded-lg border p-2" rows={3} /></label>
      <div className="grid gap-3 sm:grid-cols-2">{problem.options.map((option, optionIndex) => <label key={optionIndex} className="text-sm">Option {optionIndex + 1}<input required value={option} onChange={(event) => update(index, { options: problem.options.map((value, i) => i === optionIndex ? event.target.value : value) })} className="mt-1 w-full rounded-lg border p-2" /></label>)}</div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Correct answer<select value={problem.correctAnswer} onChange={(event) => update(index, { correctAnswer: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2">{problem.options.map((_, i) => <option key={i} value={i}>Option {i + 1}</option>)}</select></label><label className="text-sm">Points<input type="number" min={1} required value={problem.points} onChange={(event) => update(index, { points: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label></div>
      <label className="block text-sm">Solution explanation<textarea value={problem.explanation} onChange={(event) => update(index, { explanation: event.target.value })} className="mt-1 w-full rounded-lg border p-2" rows={2} /></label>
      {problems.length > 1 && <button type="button" onClick={() => setProblems((previous) => previous.filter((_, i) => i !== index))} className="text-sm text-rose-700">Remove problem</button>}
    </fieldset>)}
    <button type="button" disabled={problems.length >= 100} onClick={() => setProblems((previous) => [...previous, blankProblem()])} className="rounded-lg border bg-white px-4 py-2">Add problem</button>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <button type="submit" disabled={pending} className="ml-3 rounded-lg bg-primary-600 px-5 py-2 text-white disabled:opacity-50">{pending ? 'Publishing…' : 'Publish contest'}</button>
  </form>;
}
