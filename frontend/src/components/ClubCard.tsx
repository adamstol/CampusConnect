'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ClubCardProps {
  id: number;
  name: string;
  description: string;
}

export default function ClubCard({ id, name, description }: ClubCardProps) {
  const [joined, setJoined] = useState(false);

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
            onClick={() => setJoined((prev) => !prev)}
            className={
              joined
                ? 'flex-1 py-2 rounded-full font-medium border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                : 'flex-1 py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-colors'
            }
          >
            {joined ? 'Joined' : 'Join Club'}
          </button>
        </div>
      </div>
    </div>
  );
}
