'use client';
import { useEffect, useState } from 'react';
import { getExamsAction } from '@/actions/exam';
import { ExamCard } from '@/components/exam/ExamCard';
export default function HomeExamsSection() {
  const [exams, setExams] = useState<any[]>([]);
  useEffect(() => { let active = true; getExamsAction().then((result) => { if (active) setExams((result.exams || []).filter((exam) => exam.scope === 'GLOBAL').slice(0, 3)); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!exams.length) return null;
  return <section className="space-y-5"><h2 className="text-2xl font-bold">Global exams for you</h2><div className="grid gap-5 md:grid-cols-3">{exams.map((exam) => <ExamCard key={exam.id} {...exam} />)}</div></section>;
}
