import { render, screen } from '@testing-library/react';
import UserClubsPage from './page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

jest.mock('@/components/RoleBadge', () => ({
  __esModule: true,
  default: ({ role }: { role: string }) => <span>{role}</span>,
}));

jest.mock('@/components/ConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

describe('UserClubsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('TC-126 [S-04]: shows the user clubs after loading completes', async () => {
  window.localStorage.setItem('access_token', 'fake-token');

  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/clubs/my-clubs')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            club_id: 1,
            club_name: 'Chess Club',
            role: 'member',
            joined_at: '2026-01-01',
          },
        ],
      });
    }

    if (url.includes('/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          role_name: 'Student',
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });

  render(<UserClubsPage />);

  expect(screen.getByText('Loading clubs...')).toBeInTheDocument();

  expect(await screen.findByText('Chess Club')).toBeInTheDocument();
  expect(screen.queryByText('Loading clubs...')).not.toBeInTheDocument();
  });
});