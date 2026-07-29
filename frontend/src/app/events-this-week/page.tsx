'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import WeeklyEventsGrid, { WeeklyEvent } from '@/components/WeeklyEventsGrid';
import { API_BASE_URL } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { t, type Locale } from '@/lib/translations';

export default function EventsThisWeekPage() {
  const { language } = useTheme();
  const lang = language as Locale;
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events/this-week`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: WeeklyEvent[]) => setWeeklyEvents(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t(lang, 'eventsThisWeekHeading')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t(lang, 'eventsThisWeekSubtitle')}
          </p>
        </div>

        {weeklyEvents.length > 0 ? (
          <WeeklyEventsGrid events={weeklyEvents} />
        ) : (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-16 px-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t(lang, 'noEventsThisWeek')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{t(lang, 'checkBackSoon')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
