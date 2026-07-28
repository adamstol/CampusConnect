import Header from '@/components/Header';
import WeeklyEventsGrid, { WeeklyEvent } from '@/components/WeeklyEventsGrid';
import { API_BASE_URL } from '@/lib/api';

async function getWeeklyEvents(): Promise<WeeklyEvent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/this-week`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];

    return (await response.json()) as WeeklyEvent[];
  } catch {
    return [];
  }
}

export default async function EventsThisWeekPage() {
  const weeklyEvents = await getWeeklyEvents();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Checkout what&apos;s happening this week at York University!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover exciting events and activities happening on campus
          </p>
        </div>

        {weeklyEvents.length > 0 ? (
          <WeeklyEventsGrid events={weeklyEvents} />
        ) : (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-16 px-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events scheduled this week
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Check back soon for new campus events.</p>
          </div>
        )}
      </main>
    </div>
  );
}
