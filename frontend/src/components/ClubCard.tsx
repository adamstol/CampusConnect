'use client';

import React, { useState } from 'react';

interface ClubCardProps {
  name: string;
  description: string;
  category: string;
  location: string;
}

export default function ClubCard({ name, description, category, location }: ClubCardProps) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87" />
        </svg>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="inline-block self-start text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-full px-3 py-1 mb-2">
          {category}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-1">{description}</p>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{location}</span>
        </div>
        <button
          onClick={() => setJoined((prev) => !prev)}
          className={
            joined
              ? 'w-full py-2 rounded-full font-medium border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
              : 'w-full py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-colors'
          }
        >
          {joined ? 'Joined' : 'Join Club'}
        </button>
      </div>
    </div>
  );
}
