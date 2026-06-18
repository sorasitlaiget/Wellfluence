"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

type UserRole = 'BRAND' | 'INFLUENCER' | 'CUSTOMER';

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') as UserRole || 'CUSTOMER';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password, role });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        router.push('/');
      }
    } catch (err: any) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else if (err.response?.data?.errors) setError(err.response.data.errors[0].message || 'Validation error.');
      else setError('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your Wellfluence account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">sign in to your existing account</Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px mb-4">
            <input id="email-address" name="email" type="email" autoComplete="email" required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input id="password" name="password" type="password" autoComplete="new-password" required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">I am registering as a:</label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              {(['BRAND', 'INFLUENCER', 'CUSTOMER'] as UserRole[]).map((r) => (
                <label key={r} className={`flex items-center justify-center p-3 border rounded-md text-sm font-medium uppercase cursor-pointer transition-colors duration-200 ${role === r ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                  {r}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 text-center" role="alert">{error}</div>}
          <button type="submit" disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterFormInner />
    </Suspense>
  );
}
