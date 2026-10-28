import { redirect } from 'next/navigation';
import { getAssessmentCreationContextAction } from '@/actions/assessment-management';
import ContestCreateForm from '@/components/contest/ContestCreateForm';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const context = await getAssessmentCreationContextAction('CONTEST');
  if (context.error) redirect('/contests');
  return <ContestCreateForm courses={context.courses} canCreateGlobal={context.canCreateGlobal} />;
}
