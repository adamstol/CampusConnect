import { render, screen } from '@testing-library/react';
import UserDashboardPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    toggleDark: jest.fn(),
    resetTheme: jest.fn(),
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

jest.mock('@/components/RoleBadge', () => ({
  __esModule: true,
  default: ({ role }: { role: string }) => <span>{role}</span>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('UserDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    localStorage.clear();
    localStorage.setItem('access_token', 'test-token');

    global.fetch = jest.fn((url: RequestInfo | URL) => {
      const urlString = url.toString();

      if (urlString.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            first_name: 'Jane',
            last_name: 'Smith',
            role_name: 'Club Representative',
            notify_in_app: true,
            notify_email: true,
          }),
        });
      }

      if (urlString.includes('/events/my-club-events')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              event_id: 1,
              club_id: 10,
              club_name: 'Computer Science Club',
              event_name: 'Hackathon 2026',
              description: 'Annual coding competition',
              event_date: '2026-10-15T10:00:00.000Z',
              location: 'Lassonde Building',
            },
          ],
        });
      }

      if (urlString.includes('/events/my-events')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              event_id: 2,
              club_id: 10,
              club_name: 'Computer Science Club',
              event_name: 'AI Workshop',
              event_date: '2026-11-01T12:00:00.000Z',
              location: 'Room 200',
              status: 'registered',
              registered_at: '2026-08-01T12:00:00.000Z',
            },
          ],
        });
      }

      if (urlString.includes('/clubs/my-managed-clubs')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              club_id: 10,
              club_name: 'Computer Science Club',
              role: 'admin',
            },
          ],
        });
      }

      if (urlString.includes('/clubs/my-clubs')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              club_id: 10,
              club_name: 'Computer Science Club',
              role: 'member',
            },
          ],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }) as jest.Mock;
  });


  // Covers RTM: User dashboard functionality
  it('TC-097 [User Dashboard]: renders profile, clubs, and events', async () => {
    render(<UserDashboardPage />);

    expect(
      await screen.findByText(/Welcome back, Jane/i)
    ).toBeInTheDocument();

    expect(
  screen.getAllByText('Computer Science Club').length
).toBeGreaterThan(0);

    expect(
      screen.getByText('Hackathon 2026')
    ).toBeInTheDocument();

    expect(
      screen.getByText('AI Workshop')
    ).toBeInTheDocument();
  });
});