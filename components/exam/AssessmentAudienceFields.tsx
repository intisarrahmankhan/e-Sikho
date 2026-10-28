'use client';
import { useEffect, useState } from 'react';
import { AssessmentAudience, AssessmentKind, EDUCATION_LEVELS } from '@/lib/assessment-policy';
import { searchAssessmentStudentsAction } from '@/actions/assessment-management';

export default function AssessmentAudienceFields({ value, onChange, kind }: { value: AssessmentAudience; onChange: (value: AssessmentAudience) => void; kind: AssessmentKind }) {
  const [departmentText, setDepartmentText] = useState(value.departments.join(', '));
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<{ id: string; name: string; educationLevel: string; department: string }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (search.trim().length < 2) { setStudents([]); return; }
      searchAssessmentStudentsAction(search, kind).then((result) => { if (active) { setStudents(result.students); setSearchError(''); } }).catch(() => { if (active) setSearchError('Student search is unavailable. Try again.'); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search, kind]);
  return <fieldset className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
    <legend className="px-1 text-sm font-semibold">Who can see and join this assessment?</legend>
    <p className="text-xs text-slate-600">An empty filter allows all registered learners. When several filters are selected, students must match all of them. Students can update education details in Settings.</p>
    <div className="flex flex-wrap gap-4">{EDUCATION_LEVELS.map((level) => <label key={level} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.educationLevels.includes(level)} onChange={(event) => onChange({ ...value, educationLevels: event.target.checked ? [...value.educationLevels, level] : value.educationLevels.filter((item) => item !== level) })} />{level.charAt(0) + level.slice(1).toLowerCase()}</label>)}</div>
    <label className="block text-sm">Departments or study streams (comma separated)
      <input value={departmentText} onChange={(event) => { setDepartmentText(event.target.value); onChange({ ...value, departments: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }); }} placeholder="CSE, EEE, Science" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" />
    </label>
    <label className="block text-sm">Specific students (optional)
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or student ID" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" />
    </label>
    {searchError && <p role="alert" className="text-sm text-rose-700">{searchError}</p>}
    {students.length > 0 && <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border bg-white p-3">{students.map((student) => <label key={student.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.studentIds.includes(student.id)} onChange={(event) => { setNames((previous) => ({ ...previous, [student.id]: student.name })); onChange({ ...value, studentIds: event.target.checked ? [...value.studentIds, student.id] : value.studentIds.filter((id) => id !== student.id) }); }} />{student.name}<span className="text-xs text-slate-500">{[student.educationLevel, student.department].filter(Boolean).join(' · ')}</span></label>)}</div>}
    {!!value.studentIds.length && <div className="flex flex-wrap gap-2">{value.studentIds.map((id) => <button key={id} type="button" onClick={() => onChange({ ...value, studentIds: value.studentIds.filter((studentId) => studentId !== id) })} className="rounded-full border bg-white px-3 py-1 text-xs" aria-label={`Remove ${names[id] || id}`}>{names[id] || id.slice(-6)} ×</button>)}</div>}
  </fieldset>;
}
