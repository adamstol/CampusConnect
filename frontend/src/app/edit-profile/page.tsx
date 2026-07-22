'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/api';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}



export default function EditProfilePage() {
  const router = useRouter();
  const { resetTheme } = useTheme();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  const loadProfile = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const profile = await response.json();
        setFormData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
        });
      } else {
        setIsError(true);
        setMessage('Unable to load your profile.');
      }
    } catch {
      setIsError(true);
      setMessage('Unable to load your profile right now.');
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    Promise.resolve().then(() => loadProfile(token));
  }, [loadProfile, router]);

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

    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();
    const email = formData.email.trim();

    if (!firstName || !lastName || !email) {
      setIsError(true);
      setMessage('First name, last name, and email are required.');
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
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || 'Unable to update your profile.');
        return;
      }

      setIsError(false);
      setMessage(data.message || 'Profile updated successfully.');
    } catch {
      setIsError(true);
      setMessage('Unable to update your profile right now.');
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Update your name and email address.</p>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {isLoading ? (
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading your profile...</p>
          ) : (
            <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="first_name" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="First name"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Last name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {message && (
                <p
                  className={`md:col-span-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                    isError
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  }`}
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-red-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href="/change-password"
                  className="rounded-lg px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Change Password
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
