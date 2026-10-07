import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import AuditLog from '@/models/AuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as { role?: string };
  if (user.role !== 'SUPERADMIN') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p>Only Superadmins can view the audit log.</p>
      </div>
    );
  }

  await dbConnect();
  
  const rawLogs = await AuditLog.find({})
    .populate({ path: 'actorId', select: 'name email role' })
    .populate({ path: 'targetId', select: 'name email role' })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const logs = rawLogs.map((l: any) => ({
    id: l._id.toString(),
    action: l.action,
    category: l.category,
    actor: l.actorId ? { name: l.actorId.name, email: l.actorId.email } : null,
    target: l.targetId ? { name: l.targetId.name, email: l.targetId.email } : null,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Global system-wide administrative and security actions.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.category === 'SECURITY' ? 'bg-red-100 text-red-800' :
                          log.category === 'FINANCIAL' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <div>
                            <p>{log.actor.name}</p>
                            <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                          </div>
                        ) : 'System'}
                      </td>
                      <td className="px-4 py-3">
                        {log.target ? (
                          <div>
                            <p>{log.target.name}</p>
                            <p className="text-xs text-muted-foreground">{log.target.email}</p>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
