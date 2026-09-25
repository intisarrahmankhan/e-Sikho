'use client';

import { useState } from 'react';
import { updateUserRole } from '../actions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserRoleManager({ activeUsers }: { activeUsers: User[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: any) => {
    setLoadingId(userId);
    await updateUserRole(userId, role);
    setLoadingId(null);
  };

  if (activeUsers.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No active approved users found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Current Role</th>
            <th className="px-4 py-3 text-right">Change Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {activeUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <select
                  disabled={loadingId === user.id}
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}