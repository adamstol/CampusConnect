import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClubDetailPage from './page';

const pushMock = jest.fn();
const routerMock = { push: pushMock };

jest.mock('next/navigation', () => ({
  useParams: () => ({ clubId: '7' }),
  useRouter: () => routerMock,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img src={props.src} alt={props.alt} />,
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

// Stubbed to just render the title and whatever RSVP button ClubDetailPage
// passes as children -- EventCard's own presentation isn't this suite's concern.
jest.mock('@/components/EventCard', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ title, children }: any) => (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

const CHESS_CLUB = { club_id: 7, club_name: 'Chess Club', description: 'Weekly chess.', logo_url: null };
const TRIVIA_EVENT = {
  event_id: 5,
  event_name: 'Trivia Night',
  description: 'Casual trivia.',
  event_date: '2026-09-15T18:00:00Z',
  location: 'Student Centre',
  image_url: null,
};

function mockFetch({
  club = CHESS_CLUB,
  clubNotFound = false,
  events = [] as typeof TRIVIA_EVENT[],
  announcements = [] as { announcement_id: number; title: string; body: string; created_at: string }[],
  myClubs = [] as { club_id: number }[],
  registrations = [] as { event_id: number }[],
} = {}) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    const ok = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => data });

    if (url.includes('/clubs/my-managed-clubs')) return ok([]);
    if (url.includes('/clubs/my-clubs')) return ok(myClubs);
    if (url.includes('/events/my-registrations')) return ok(registrations);
    if (url.includes('/events/club/')) return ok(events);
    if (url.includes('/announcements')) return ok(announcements);
    if (url.includes('/join') || url.includes('/leave')) return ok({});
    if (url.includes('/register') || url.includes('/cancel')) return ok({});
    if (/\/clubs\/7$/.test(url)) {
      if (clubNotFound) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      return ok(club);
    }
    return ok({});
  });
}

// Covers RTM: S-06 (view club details/events), S-04 (join/leave), S-08 (event registration)
describe('ClubDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('TC-126 [S-06]: shows "Club not found" and a Back to Clubs link when the club fetch 404s', async () => {
    mockFetch({ clubNotFound: true });
    render(<ClubDetailPage />);

    expect(await screen.findByText('Club not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Clubs' })).toHaveAttribute('href', '/clubs');
  });

  it('TC-127 [S-06]: renders the club name, description, and upcoming events once loaded', async () => {
    mockFetch({ events: [TRIVIA_EVENT] });
    render(<ClubDetailPage />);

    expect(await screen.findByText('Chess Club')).toBeInTheDocument();
    expect(screen.getByText('Weekly chess.')).toBeInTheDocument();
    expect(screen.getByText('Trivia Night')).toBeInTheDocument();
  });

  it('TC-128 [S-06]: shows "No upcoming events." when the events list is empty', async () => {
    mockFetch({ events: [] });
    render(<ClubDetailPage />);

    await screen.findByText('Chess Club');
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  it('TC-129 [S-04]: clicking Join Club with no access token redirects to a clubId-scoped login redirect', async () => {
    mockFetch();
    render(<ClubDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Join Club' }));

    expect(pushMock).toHaveBeenCalledWith('/login?redirect=/clubs/7');
  });

  it('TC-130 [S-04]: confirming the join modal calls the join endpoint and switches the button to Leave Club', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    mockFetch();
    render(<ClubDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Join Club' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Join Club' })[1]); // modal's confirm button

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Leave Club' })).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/clubs/7/join',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('TC-131 [S-04]: confirming the leave modal calls the leave endpoint and switches the button back to Join Club', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    mockFetch({ myClubs: [{ club_id: 7 }] });
    render(<ClubDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Leave Club' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave Club' })[1]); // modal's confirm button

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Join Club' })).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/clubs/7/leave',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('TC-132 [S-08]: clicking RSVP registers for an event and the button becomes Cancel RSVP', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    mockFetch({ events: [TRIVIA_EVENT] });
    render(<ClubDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'RSVP' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel RSVP' })).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/events/5/register',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('TC-133 [S-06]: renders announcements when present', async () => {
    mockFetch({
      announcements: [
        { announcement_id: 1, title: 'Welcome!', body: 'Kickoff meeting Thursday.', created_at: '2026-08-01T00:00:00Z' },
      ],
    });
    render(<ClubDetailPage />);

    expect(await screen.findByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText('Kickoff meeting Thursday.')).toBeInTheDocument();
  });
});