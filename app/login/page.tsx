'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials or account pending approval.');
      } else {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-xl font-bold text-white shadow">
            eS
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Sign in to e-Shikho</h2>
          <p className="text-xs text-gray-500 mt-1">Enter your account credentials below</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eshikho.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-1 text-center">
          <p className="font-semibold text-gray-700">Demo Accounts:</p>
          <p>Admin: <span className="font-mono text-gray-800">admin@eshikho.com / admin123456</span></p>
          <p>Instructor: <span className="font-mono text-gray-800">instructor@eshikho.com / instructor123</span></p>
          <p>Student: <span className="font-mono text-gray-800">student@eshikho.com / student123</span></p>
        </div>
      </div>
    </div>
  );
}