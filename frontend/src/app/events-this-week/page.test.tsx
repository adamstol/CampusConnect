import { render, screen } from '@testing-library/react';
import EventsThisWeekPage from './page';

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

jest.mock('@/components/WeeklyEventsGrid', () => ({
  __esModule: true,
  default: ({ events }: { events: { title: string }[] }) => (
    <div data-testid="weekly-events-grid">
      {events.map((event) => (
        <div key={event.title}>{event.title}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ language: 'en' }),
}));

jest.mock('@/lib/translations', () => ({
  t: (_lang: string, key: string) => key,
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

const EVENTS = [
  {
    event_id: 1,
    title: 'Hackathon',
  },
];

describe('EventsThisWeekPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('TC-132 [S-04]: displays this week’s events when the API returns events', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => EVENTS,
    });

    render(<EventsThisWeekPage />);

    expect(await screen.findByText('Hackathon')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-events-grid')).toBeInTheDocument();
  });

  it('TC-133 [S-04]: displays the empty state when there are no events this week', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<EventsThisWeekPage />);

    expect(await screen.findByText('noEventsThisWeek')).toBeInTheDocument();
    expect(screen.getByText('checkBackSoon')).toBeInTheDocument();
  });
});