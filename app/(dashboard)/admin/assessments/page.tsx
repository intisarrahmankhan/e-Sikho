import AssessmentCourseAssignment from '@/components/admin/AssessmentCourseAssignment';
import { getAssessmentCreationContextAction } from '@/actions/assessment-management';
import { redirect } from 'next/navigation';
import { getAssessmentViewer } from '@/lib/assessment-access';
import { getGlobalAssessmentApplicationsAction } from '@/actions/assessment-management';
import GlobalAssessmentApplications from '@/components/exam/GlobalAssessmentApplications';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const actor = await getAssessmentViewer();
  if (!actor) redirect('/login');
  if (actor.role !== 'SUPERADMIN') redirect('/admin');
  const result = await getGlobalAssessmentApplicationsAction();
  const context = await getAssessmentCreationContextAction('EXAM');
  return <><AssessmentCourseAssignment courses={context.courses} /><GlobalAssessmentApplications applications={result.applications} reviewer /></>;
}
