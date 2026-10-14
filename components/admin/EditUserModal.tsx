'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X, Loader2, Mail, Phone, Lock, User as UserIcon } from 'lucide-react';
import { editUser } from '@/actions/admin';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status?: string;
  } | null;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN'>('STUDENT');
  const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'BLOCKED' | 'SUSPENDED'>('APPROVED');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole((user.role as any) || 'STUDENT');
      setStatus((user.status as any) || 'APPROVED');
      setPassword('');
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await editUser(user.id, {
        name,
        email,
        phone: phone.trim() || undefined,
        role,
        status,
        password: password.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update user.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit User Details</h2>
              <p className="text-xs text-gray-500">Modify information for {user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvir Hasan"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reset Password (Optional)
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="STUDENT">STUDENT (শিক্ষার্থী)</option>
                <option value="INSTRUCTOR">INSTRUCTOR (ইন্সট্রাক্টর)</option>
                <option value="MODERATOR">MODERATOR (মডারেটর)</option>
                <option value="ADMIN">ADMIN (প্রশাসক)</option>
                <option value="SUPERADMIN">SUPERADMIN (সুপার অ্যাডমিন)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="APPROVED">APPROVED (সক্রিয়)</option>
                <option value="PENDING">PENDING (অপেক্ষমান)</option>
                <option value="SUSPENDED">SUSPENDED (স্থগিত)</option>
                <option value="BLOCKED">BLOCKED (ব্লকড)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
