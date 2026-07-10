import Header from '@/components/Header';
import EventCarousel, { CarouselEvent } from '@/components/EventCarousel';
import CTASection from '@/components/CTASection';

interface ApiEvent {
  event_id: number;
  event_name: string;
  event_date: string;
  location: string | null;
}

const API_BASE_URL = 'http://127.0.0.1:5000';

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

async function getHomeEvents(): Promise<CarouselEvent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/public`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];

    const events = (await response.json()) as ApiEvent[];

    return events.map((event) => ({
      id: event.event_id,
      title: event.event_name,
      location: event.location || 'York University',
      date: formatEventDate(event.event_date),
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const events = await getHomeEvents();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main>
        <EventCarousel events={events} />
        <CTASection />
      </main>
    </div>
  );
}
