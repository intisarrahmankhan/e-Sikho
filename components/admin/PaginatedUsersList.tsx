'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  ShieldAlert,
  Ban,
  Trash2,
  BookPlus,
  Search,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  GraduationCap,
  UserPlus,
  Edit3,
} from 'lucide-react';
import { getPaginatedUsers } from '@/actions/users';
import {
  updateUserRole,
  blockUser,
  unblockUser,
  deleteUser,
} from '@/actions/admin';
import AssignCourseModal from '@/components/admin/AssignCourseModal';
import DeleteUserConfirmModal from '@/components/admin/DeleteUserConfirmModal';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
}

interface PaginatedUsersListProps {
  isSuperadmin?: boolean;
}

export default function PaginatedUsersList({ isSuperadmin: isSuperadminProp }: PaginatedUsersListProps) {
  const { data: session } = useSession();
  const isSuperadmin =
    isSuperadminProp !== undefined
      ? isSuperadminProp
      : (session?.user as any)?.role === 'SUPERADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [assignModalUser, setAssignModalUser] = useState<User | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPaginatedUsers({ page, limit, searchEmail });
      setUsers(data.users as User[]);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchEmail]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, role: any) => {
    setActionLoadingId(userId);
    setFeedback(null);
    try {
      const res = await updateUserRole(userId, role);
      if (res.success) {
        setFeedback({ type: 'success', message: 'User role updated successfully.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update user role.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error updating role.' });
    } finally {
      setActionLoadingId(null);
      fetchUsers();
    }
  };

  const handleToggleBlock = async (user: User) => {
    const isCurrentlyBlocked = user.status === 'BLOCKED';
    const actionText = isCurrentlyBlocked ? 'unblock' : 'block';

    if (!confirm(`Are you sure you want to ${actionText} ${user.name}?`)) return;

    setActionLoadingId(user.id);
    setFeedback(null);
    try {
      const res = isCurrentlyBlocked ? await unblockUser(user.id) : await blockUser(user.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || `User ${actionText}ed successfully.` });
      } else {
        setFeedback({ type: 'error', message: res.error || `Failed to ${actionText} user.` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || `Error attempting to ${actionText} user.` });
    } finally {
      setActionLoadingId(null);
      fetchUsers();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await deleteUser(deleteModalUser.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'User deleted successfully.' });
        setDeleteModalUser(null);
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete user.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error deleting user.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Superadmin Mode Indicator */}
      {isSuperadmin && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-indigo-900">
              SuperAdmin Privileges Active
            </span>
            <span className="text-xs text-indigo-700 hidden sm:inline">
              — You can assign courses, block accounts, and remove users.
            </span>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-600 text-white shadow-2xs shrink-0">
            SUPERADMIN
          </span>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 text-xs rounded-xl font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shrink-0 active:scale-[0.98]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-2xs shrink-0 active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add New User</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <label htmlFor="limit-select" className="font-medium">Per page:</label>
            <select
              id="limit-select"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table: Responsive, unified User+Email cell, fits 100% without forced horizontal scroll */}
      <div className="overflow-x-auto relative rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="flex items-center gap-2 text-indigo-600 font-semibold text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </span>
          </div>
        )}
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-h-[160px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-bold">User & Email</th>
              <th className="px-3 py-3 font-bold">Role</th>
              <th className="px-3 py-3 font-bold">Account Status</th>
              <th className="px-4 py-3 text-right font-bold">Superadmin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-xs text-slate-500">
                  No matching users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const userStatus = user.status || 'APPROVED';
                const isSuperadminAccount = user.role === 'SUPERADMIN';
                const isBlocked = userStatus === 'BLOCKED' || userStatus === 'SUSPENDED';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    {/* Unified User & Email Cell */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 leading-snug">
                        <span className="truncate max-w-[200px] sm:max-w-[280px]" title={user.name}>{user.name}</span>
                        {isSuperadminAccount && (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 shrink-0">
                            ★ Super
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal truncate max-w-[200px] sm:max-w-[280px] mt-0.5" title={user.email}>
                        {user.email}
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {isSuperadmin ? (
                        <select
                          disabled={actionLoadingId === user.id || isSuperadminAccount}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="INSTRUCTOR">INSTRUCTOR</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Account Status Badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] sm:text-xs rounded-full font-bold ${
                          userStatus === 'BLOCKED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : userStatus === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : userStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {userStatus === 'BLOCKED' && <Ban className="h-3 w-3 shrink-0" />}
                        {userStatus}
                      </span>
                    </td>

                    {/* Compact Superadmin Action Buttons */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        {/* 1. Assign Course Button */}
                        {(user.role === 'STUDENT' || user.role === 'INSTRUCTOR') && (
                          <button
                            onClick={() => setAssignModalUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                            title="Assign Course directly to learner"
                          >
                            <BookPlus className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Assign</span>
                          </button>
                        )}

                        {/* 2. Edit User Button */}
                        {isSuperadmin && (
                          <button
                            onClick={() => setEditModalUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Edit user details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                        )}

                        {/* 3. Block / Unblock Button */}
                        {isSuperadmin && !isSuperadminAccount && (
                          <button
                            disabled={actionLoadingId === user.id}
                            onClick={() => handleToggleBlock(user)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                              isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                            }`}
                            title={isBlocked ? 'Unblock user' : 'Block user from platform'}
                          >
                            {actionLoadingId === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isBlocked ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden lg:inline">
                              {isBlocked ? 'Unblock' : 'Block'}
                            </span>
                          </button>
                        )}

                        {/* 4. Remove Button */}
                        {isSuperadmin && !isSuperadminAccount && (
                          <button
                            disabled={actionLoadingId === user.id}
                            onClick={() => setDeleteModalUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                            title="Remove user permanently from platform"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Remove</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-slate-800">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {assignModalUser && (
        <AssignCourseModal
          student={assignModalUser}
          isOpen={!!assignModalUser}
          onClose={() => {
            setAssignModalUser(null);
            fetchUsers();
          }}
        />
      )}

      {deleteModalUser && (
        <DeleteUserConfirmModal
          user={deleteModalUser}
          isOpen={!!deleteModalUser}
          isLoading={isDeleting}
          onClose={() => setDeleteModalUser(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {editModalUser && (
        <EditUserModal
          user={editModalUser}
          isOpen={!!editModalUser}
          onClose={() => setEditModalUser(null)}
          onSuccess={() => {
            setFeedback({ type: 'success', message: 'User updated successfully.' });
            fetchUsers();
          }}
        />
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setFeedback({ type: 'success', message: 'User created successfully.' });
          fetchUsers();
        }}
      />
    </div>
  );
}
