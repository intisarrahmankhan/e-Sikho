import { getRevisionRequestsAction } from '@/actions/revision-access';
import RevisionRequestQueue from '@/components/instructor/RevisionRequestQueue';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const result = await getRevisionRequestsAction();
  return <RevisionRequestQueue {...result} />;
}
