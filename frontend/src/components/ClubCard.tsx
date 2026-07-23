'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

interface ClubCardProps {
  id: number;
  name: string;
  description: string;
  initialJoined?: boolean;
}

export default function ClubCard({ id, name, description, initialJoined = false }: ClubCardProps) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep joined in sync if initialJoined updates later (e.g. membership loads after this card renders).
  const [prevInitialJoined, setPrevInitialJoined] = useState(initialJoined);
  if (initialJoined !== prevInitialJoined) {
    setPrevInitialJoined(initialJoined);
    setJoined(initialJoined);
  }

  async function handleJoinToggle() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/clubs');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${id}/${joined ? 'leave' : 'join'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setJoined((prev) => !prev);
      }
    } catch {
      // Network error — leave the button in its current state.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87" />
        </svg>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{description}</p>
        <div className="flex gap-2">
          <Link
            href={`/clubs/${id}`}
            className="flex-1 py-2 rounded-full font-medium text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View
          </Link>
          <button
            onClick={handleJoinToggle}
            disabled={isSubmitting}
            className={
              joined
                ? 'flex-1 py-2 rounded-full font-medium border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50'
                : 'flex-1 py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50'
            }
          >
            {isSubmitting ? '...' : joined ? 'Joined' : 'Join Club'}
          </button>
        </div>
      </div>
    </div>
  );
}
