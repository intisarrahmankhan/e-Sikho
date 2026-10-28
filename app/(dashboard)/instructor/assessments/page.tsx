import { redirect } from 'next/navigation';
import { getAssessmentViewer } from '@/lib/assessment-access';
import { getGlobalAssessmentApplicationsAction } from '@/actions/assessment-management';
import GlobalAssessmentApplications from '@/components/exam/GlobalAssessmentApplications';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const actor = await getAssessmentViewer();
  if (!actor) redirect('/login');
  if (actor.role !== 'INSTRUCTOR') redirect('/exams');
  const result = await getGlobalAssessmentApplicationsAction();
  return <GlobalAssessmentApplications applications={result.applications} />;
}
