'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

interface Club {
  club_id: number;
  club_name: string;
  description: string | null;
}

const API_BASE_URL = 'http://localhost:5000';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(true);

  const loadClubs = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        setHasToken(false);
        setClubs([]);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Unable to load clubs.');
        return;
      }

      setClubs(data);
    } catch {
      setMessage('Unable to load clubs right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setHasToken(false);
        setIsLoading(false);
        return;
      }

      loadClubs(token);
    });
  }, [loadClubs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Campus Directory</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Clubs</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Browse every club currently stored in CampusConnect.
            </p>
          </div>

          <Link
            href="/userclubs"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700"
          >
            Create Club
          </Link>
        </div>

        {!hasToken ? (
          <section className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
            <h2 className="text-xl font-bold text-gray-900">Sign in to view clubs</h2>
            <p className="mt-2 text-gray-600">The clubs endpoint requires an authenticated account.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
            >
              Go to Login
            </Link>
          </section>
        ) : isLoading ? (
          <section className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-sm font-semibold text-gray-600">Loading clubs...</p>
          </section>
        ) : message ? (
          <section className="rounded-lg border border-red-100 bg-red-50 p-8 shadow-md">
            <p className="font-semibold text-red-700">{message}</p>
          </section>
        ) : clubs.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => (
              <article key={club.club_id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-md">
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Club #{club.club_id}</p>
                <h2 className="mt-2 text-xl font-bold text-gray-900">{club.club_name}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {club.description || 'No description has been added yet.'}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">No clubs found</h2>
            <p className="mt-2 text-gray-600">Create a club to populate the directory.</p>
          </section>
        )}
      </main>
    </div>
  );
}
