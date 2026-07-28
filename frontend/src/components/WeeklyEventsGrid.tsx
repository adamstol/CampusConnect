'use client';

import EventRegisterButton from '@/components/EventRegisterButton';
import { useEventRegistration } from '@/hooks/useEventRegistration';

export interface WeeklyEvent {
  event_id: number;
  event_name: string;
  club_name: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

interface WeeklyEventsGridProps {
  events: WeeklyEvent[];
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function WeeklyEventsGrid({ events }: WeeklyEventsGridProps) {
  const { registeredEventIds, submittingEventId, toggleRegistration } =
    useEventRegistration('/events-this-week');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div
          key={event.event_id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
        >
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {event.event_name}
            </h3>
            <p className="text-sm text-red-600 font-medium mb-2">{event.club_name}</p>
            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{event.location || 'York University'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            <div className="mt-auto">
              <EventRegisterButton
                eventId={event.event_id}
                isRegistered={registeredEventIds.has(event.event_id)}
                isSubmitting={submittingEventId === event.event_id}
                onToggle={toggleRegistration}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
