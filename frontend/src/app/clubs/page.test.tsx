import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClubsPage from './page';

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

// Stubbed out so this suite only exercises ClubsPage's own fetch/filter/loading
// logic, not ClubCard's internals (those are covered by ClubCard.test.tsx).
jest.mock('@/components/ClubCard', () => ({
  __esModule: true,
  default: ({ name, initialJoined }: { name: string; initialJoined?: boolean }) => (
    <div data-testid="club-card">
      {name}
      {initialJoined ? ' (joined)' : ''}
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

const CHESS = { club_id: 1, club_name: 'Chess Club', description: 'Weekly chess.', logo_url: null };
const CODING = { club_id: 2, club_name: 'Coding Club', description: 'Build things.', logo_url: null };

function mockFetch({
  clubs = [CHESS, CODING],
  clubsFail = false,
  myClubs = [] as { club_id: number }[],
} = {}) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/clubs/my-clubs')) {
      return Promise.resolve({ ok: true, json: async () => myClubs });
    }
    if (url.endsWith('/clubs/')) {
      if (clubsFail) return Promise.resolve({ ok: false, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => clubs });
    }
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

// Covers RTM: S-03 (Browse available clubs within the platform)
describe('ClubsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('TC-120 [S-03]: shows a loading state, then renders a club card per club once loaded', async () => {
    mockFetch();
    render(<ClubsPage />);

    expect(screen.getByText('loadingClubs')).toBeInTheDocument();

    expect(await screen.findByText('Chess Club')).toBeInTheDocument();
    expect(screen.getByText('Coding Club')).toBeInTheDocument();
    expect(screen.queryByText('loadingClubs')).not.toBeInTheDocument();
  });

  it('TC-121 [S-03]: shows an error message when the clubs fetch fails', async () => {
    mockFetch({ clubsFail: true });
    render(<ClubsPage />);

    expect(await screen.findByText('Unable to load clubs right now. Please try again later.')).toBeInTheDocument();
  });

  it('TC-122 [S-03]: shows "no clubs available" when the clubs list is empty', async () => {
    mockFetch({ clubs: [] });
    render(<ClubsPage />);

    expect(await screen.findByText('noClubsAvailable')).toBeInTheDocument();
  });

  it('TC-123 [S-03]: filters the displayed clubs by the search query', async () => {
    mockFetch();
    render(<ClubsPage />);
    await screen.findByText('Chess Club');

    fireEvent.change(screen.getByPlaceholderText('searchClubs'), { target: { value: 'chess' } });

    expect(screen.getByText('Chess Club')).toBeInTheDocument();
    expect(screen.queryByText('Coding Club')).not.toBeInTheDocument();
  });

  it('TC-124 [S-03]: shows "no clubs matching" when the search matches nothing', async () => {
    mockFetch();
    render(<ClubsPage />);
    await screen.findByText('Chess Club');

    fireEvent.change(screen.getByPlaceholderText('searchClubs'), { target: { value: 'robotics' } });

    expect(await screen.findByText('noClubsMatching')).toBeInTheDocument();
  });

  it('TC-125 [S-03]: passes initialJoined=true through to a club the user has already joined', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    mockFetch({ myClubs: [{ club_id: 1 }] });

    render(<ClubsPage />);

    expect(await screen.findByText('Chess Club (joined)')).toBeInTheDocument();
    expect(screen.getByText('Coding Club')).toBeInTheDocument();
  });
});