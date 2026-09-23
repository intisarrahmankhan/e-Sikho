'use client';

import { useState } from 'react';
import { updateUserStatus } from '../actions';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export default function PendingApprovals({ pendingUsers }: { pendingUsers: PendingUser[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoadingId(userId);
    await updateUserStatus(userId, status);
    setLoadingId(null);
  };

  if (pendingUsers.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No pending registration requests at the moment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Requested Role</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pendingUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  disabled={loadingId === user.id}
                  onClick={() => handleAction(user.id, 'APPROVED')}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  Approve
                </button>
                <button
                  disabled={loadingId === user.id}
                  onClick={() => handleAction(user.id, 'REJECTED')}
                  className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}