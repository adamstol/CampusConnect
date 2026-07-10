'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

const API_BASE_URL = 'http://localhost:5000';
const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();
  const [formData, setFormData] = useState<PasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setIsError(true);
      setMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || 'Unable to change your password.');
        return;
      }

      setIsError(false);
      setMessage('Password changed successfully.');
      setFormData({ password: '', confirmPassword: '' });
    } catch {
      setIsError(true);
      setMessage('Unable to change your password right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/user-dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Change Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Choose a new password for your account.</p>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form className="grid grid-cols-1 gap-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClasses}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                required
              />
            </div>

            {message && (
              <p
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  isError
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                }`}
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-red-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Update Password'}
              </button>
              <Link
                href="/edit-profile"
                className="rounded-lg px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
