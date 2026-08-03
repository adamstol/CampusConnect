import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from './page';

const pushMock = jest.fn();
const resetThemeMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    resetTheme: resetThemeMock,
  }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('TC-126 [S-12]: redirects unauthenticated users to the login page', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('TC-127 [S-12]: displays the admin dashboard for administrator accounts', async () => {
    window.localStorage.setItem('access_token', 'fake-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        role_name: 'Administrator',
      }),
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Club Management')).toBeInTheDocument();
    expect(screen.getByText('Event Management')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Statistics & Reporting')).toBeInTheDocument();
  });

  it('TC-128 [S-12]: redirects non-administrators to the user dashboard', async () => {
    window.localStorage.setItem('access_token', 'fake-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        role_name: 'Student',
      }),
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/user-dashboard');
    });
  });
});