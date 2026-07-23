'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

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

function canManageClub(club: ClubMembership) {
  return club.role === 'admin' || club.role === 'representative';
}

const EMPTY_EDIT_FORM: ClubFormData = { clubName: '', description: '' };

export default function UserClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubMembership[]>([]);
  const [formData, setFormData] = useState<ClubFormData>({
    clubName: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClubFormData>(EMPTY_EDIT_FORM);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

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
      notify('Unable to load your clubs right now.', true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  function notify(text: string, isError: boolean) {
    setMessage(text);
    setHasError(isError);
  }

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
      notify('Club name is required.', true);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setHasError(false);

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
        notify(data.message || 'Unable to create club.', true);
        return;
      }

      setFormData({ clubName: '', description: '' });
      notify(data.message || 'Club created successfully.', false);
      await loadClubs(token);
    } catch {
      notify('Unable to create club right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function startEditing(club: ClubMembership) {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoadingEditId(club.club_id);
    setMessage('');
    setHasError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${club.club_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        notify('Unable to load club details.', true);
        return;
      }

      const data = (await response.json()) as { club_name: string; description: string | null };
      setEditingId(club.club_id);
      setEditForm({
        clubName: data.club_name,
        description: data.description || '',
      });
    } catch {
      notify('Unable to load club details right now.', true);
    } finally {
      setLoadingEditId(null);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token || editingId === null) return;

    const clubName = editForm.clubName.trim();
    if (!clubName) {
      notify('Club name is required.', true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          club_name: clubName,
          description: editForm.description.trim(),
        }),
      });

      const data = (await response.json()) as ApiMessage;

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to update club.', true);
        return;
      }

      setEditingId(null);
      setEditForm(EMPTY_EDIT_FORM);
      notify(data.message || 'Club updated successfully.', false);
      await loadClubs(token);
    } catch {
      notify('Unable to update club right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(clubId: number, clubName: string) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!window.confirm(`Delete "${clubName}"? This cannot be undone.`)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = (await response.json()) as ApiMessage;

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to delete club.', true);
        return;
      }

      if (editingId === clubId) {
        setEditingId(null);
        setEditForm(EMPTY_EDIT_FORM);
      }

      notify(data.message || 'Club deleted successfully.', false);
      await loadClubs(token);
    } catch {
      notify('Unable to delete club right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/user-dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-sm font-bold text-white">CC</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">CampusConnect</span>
          </Link>

          <Link href="/user-dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <p
            className={`mb-8 rounded-lg px-4 py-3 text-sm font-semibold ${
              hasError
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-md">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">UserClubs</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Manage clubs</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create new clubs or edit and delete clubs you administer.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="clubName" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Club Name
              </label>
              <input
                id="clubName"
                name="clubName"
                type="text"
                value={formData.clubName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                placeholder="Computer Science Club"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="min-h-32 w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                placeholder="A short summary of the club."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : 'Create Club'}
            </button>
          </form>
        </section>

        <section className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-md">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Memberships</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Your clubs</h2>
            </div>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'}
            </span>
          </div>

          {isLoading ? (
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading clubs...</p>
          ) : clubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {clubs.map((club) => (
                <article key={club.club_id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  {editingId === club.club_id ? (
                    <form className="space-y-4" onSubmit={handleUpdate}>
                      <div>
                        <label htmlFor="editClubName" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                          Club Name
                        </label>
                        <input
                          id="editClubName"
                          name="clubName"
                          type="text"
                          value={editForm.clubName}
                          onChange={handleEditChange}
                          className={inputClasses}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="editDescription" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                          Description
                        </label>
                        <textarea
                          id="editDescription"
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          className={`${inputClasses} min-h-24 resize-y`}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(EMPTY_EDIT_FORM);
                            setMessage('');
                          }}
                          className="rounded-lg px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{club.club_name}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Joined {new Date(club.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-red-50 dark:bg-red-900/30 px-3 py-1 text-xs font-bold uppercase text-red-700 dark:text-red-400">
                          {club.role}
                        </span>
                      </div>

                      {canManageClub(club) && (
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(club)}
                            disabled={loadingEditId !== null || isSubmitting}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            {loadingEditId === club.club_id ? 'Loading...' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(club.club_id, club.club_name)}
                            disabled={isSubmitting}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No clubs yet</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create your first club to see it here.</p>
            </div>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}
