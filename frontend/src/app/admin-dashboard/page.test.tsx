import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboardPage from './page';

const pushMock = jest.fn();
const resetThemeMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/RoleBadge', () => ({
  __esModule: true,
  default: ({ role }: { role: string }) => <span>{role}</span>,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    resetTheme: resetThemeMock,
  }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

const USERS = [
  {
    user_id: 1,
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@test.com',
    role_name: 'Student',
    is_account_locked: false,
    is_account_enabled: true,
    created_at: '2026-01-01',
  },
];

const CLUBS = [
  {
    club_id: 1,
    club_name: 'Chess Club',
    description: 'Weekly chess.',
  },
];

const STATS = {
  total_users: 25,
  total_clubs: 4,
  total_events: 10,
};

function mockFetch() {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/admin/users')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => USERS,
      });
    }

    if (url.includes('/admin/dashboard')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => STATS,
      });
    }

    if (url.includes('/clubs/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => CLUBS,
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('TC-129 [S-12]: redirects unauthenticated users to the login page', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('TC-130 [S-12]: renders the dashboard after successfully loading data', async () => {
    window.localStorage.setItem('access_token', 'token');
    mockFetch();

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Accounts')).toBeInTheDocument();
    expect(screen.getByText('All Clubs')).toBeInTheDocument();
  });

  it('TC-131 [S-12]: filters users using the search box', async () => {
    window.localStorage.setItem('access_token', 'token');
    mockFetch();

    render(<AdminDashboardPage />);

    await waitFor(() => {
  expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
});

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, email, or role'),
      {
        target: { value: 'bob' },
      }
    );

    expect(screen.getByText('No users match "bob".')).toBeInTheDocument();
  });
});