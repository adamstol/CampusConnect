import { render, screen } from '@testing-library/react';
import ManageEventsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    resetTheme: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

jest.mock('@/components/ConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ManageEventsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    localStorage.clear();
    localStorage.setItem('access_token', 'test-token');

    global.fetch = jest.fn((url: RequestInfo | URL) => {
      const urlString = url.toString();

      if (urlString.includes('/clubs/my-managed-clubs')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              club_id: 1,
              club_name: 'Computer Science Club',
              role: 'admin',
            },
          ],
        });
      }

      if (urlString.includes('/events/club/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              event_id: 10,
              event_name: 'Hackathon 2026',
              description: 'Annual coding competition',
              event_date: '2026-10-15T10:00:00.000Z',
              location: 'Lassonde Building',
              image_url: null,
            },
          ],
        });
      }

      if (urlString.includes('/clubs/1/members')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }) as jest.Mock;
  });


  // Covers RTM: Manage Events functionality
  it('TC-096 [Manage Events]: renders managed clubs and scheduled events', async () => {
    render(<ManageEventsPage />);

    expect(
      await screen.findByText('Computer Science Club')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Hackathon 2026')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Annual coding competition')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Lassonde Building')
    ).toBeInTheDocument();
  });
});