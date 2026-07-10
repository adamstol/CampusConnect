'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

interface ClubMembership {
  club_id: number;
  club_name: string;
  role: string;
  joined_at: string;
}

interface ClubFormData {
  clubName: string;
  description: string;
}

interface ApiMessage {
  message?: string;
  club_id?: number;
}

interface LoadClubsOptions {
  isInitialLoad?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function UserClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubMembership[]>([]);
  const [formData, setFormData] = useState<ClubFormData>({
    clubName: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClubs = useCallback(async (token: string, options: LoadClubsOptions = {}) => {
    if (!options.isInitialLoad) setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/my-clubs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      setClubs(response.ok ? data : []);
    } catch {
      setMessage('Unable to load your clubs right now.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    Promise.resolve().then(() => loadClubs(token, { isInitialLoad: true }));
  }, [loadClubs, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    const clubName = formData.clubName.trim();
    const description = formData.description.trim();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!clubName) {
      setMessage('Club name is required.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          club_name: clubName,
          description,
        }),
      });

      const data = (await response.json()) as ApiMessage;

      if (!response.ok) {
        setMessage(data.message || 'Unable to create club.');
        return;
      }

      setFormData({ clubName: '', description: '' });
      setMessage(data.message || 'Club created successfully.');
      await loadClubs(token);
    } catch {
      setMessage('Unable to create club right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/user-dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-sm font-bold text-white">CC</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">CampusConnect</span>
          </Link>

          <Link href="/user-dashboard" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:px-8">
        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">UserClubs</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Create a club</h1>
            <p className="mt-2 text-sm text-gray-600">
              New clubs are added to your memberships with you as the club admin.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="clubName" className="mb-2 block text-sm font-semibold text-gray-900">
                Club Name
              </label>
              <input
                id="clubName"
                name="clubName"
                type="text"
                value={formData.clubName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                placeholder="Computer Science Club"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="min-h-32 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                placeholder="A short summary of the club."
              />
            </div>

            {message && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" aria-live="polite">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : 'Create Club'}
            </button>
          </form>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Memberships</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Your clubs</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'}
            </span>
          </div>

          {isLoading ? (
            <p className="text-sm font-semibold text-gray-600">Loading clubs...</p>
          ) : clubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {clubs.map((club) => (
                <article key={club.club_id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{club.club_name}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Joined {new Date(club.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700">
                      {club.role}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <h3 className="text-lg font-bold text-gray-900">No clubs yet</h3>
              <p className="mt-2 text-sm text-gray-600">Create your first club to see it here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
