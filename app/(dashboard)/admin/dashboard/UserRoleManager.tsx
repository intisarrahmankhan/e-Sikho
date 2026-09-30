'use client';

import { useState } from 'react';
import { updateUserRole, toggleUserSuspend } from '@/actions/admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

export default function UserRoleManager({ activeUsers }: { activeUsers: User[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<User | null>(null);

  // Client-side search and filtering logic
  const filteredUsers = activeUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const userStatus = user.status || 'APPROVED';
    const matchesStatus = statusFilter === 'ALL' || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, role: any) => {
    setLoadingId(userId);
    await updateUserRole(userId, role);
    setLoadingId(null);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedUserForSuspend) return;
    setLoadingId(selectedUserForSuspend.id);
    const currentStatus = selectedUserForSuspend.status || 'APPROVED';
    await toggleUserSuspend(selectedUserForSuspend.id, currentStatus);
    setSelectedUserForSuspend(null);
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Current Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-xs text-gray-500">
                  No matching users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const userStatus = user.status || 'APPROVED';
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>

                    {/* Role Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        disabled={loadingId === user.id || user.role === 'SUPERADMIN'}
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

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${
                          userStatus === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-700'
                            : userStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {userStatus}
                      </span>
                    </td>

                    {/* Suspend Toggle Button */}
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={loadingId === user.id || user.role === 'SUPERADMIN'}
                        onClick={() => setSelectedUserForSuspend(user)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition ${
                          userStatus === 'SUSPENDED'
                            ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {userStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Account Suspension Confirmation Modal */}
      {selectedUserForSuspend && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl border border-gray-100">
            <h4 className="text-base font-bold text-gray-900 mb-2">
              Confirm Account {(selectedUserForSuspend.status || 'APPROVED') === 'SUSPENDED' ? 'Unsuspend' : 'Suspension'}
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to {(selectedUserForSuspend.status || 'APPROVED') === 'SUSPENDED' ? 'unsuspend' : 'suspend'}{' '}
              <strong className="text-gray-900">{selectedUserForSuspend.name}</strong> ({selectedUserForSuspend.email})?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForSuspend(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={loadingId === selectedUserForSuspend.id}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}