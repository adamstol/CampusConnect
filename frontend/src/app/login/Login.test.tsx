import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

const pushMock = jest.fn();
const initThemeForUserMock = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ initThemeForUser: initThemeForUserMock }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-01 (Register for a new account and log into the system) -- login half.
describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    global.fetch = jest.fn();
  });

  function fillAndSubmit(email = 'jane@school.edu', password = 'Valid123!') {
    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: password } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  }

  it('TC-086 [S-01]: renders the login form with email, password, and a forgot-password link', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('TC-087 [S-01]: on success, stores the access token, initializes the theme, and redirects to /user-dashboard by default', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-jwt-token' }),
    });

    render(<LoginPage />);
    fillAndSubmit('jane@school.edu', 'Valid123!');

    await waitFor(() => {
      expect(window.localStorage.getItem('access_token')).toBe('fake-jwt-token');
    });
    expect(initThemeForUserMock).toHaveBeenCalledWith('jane@school.edu');
    expect(pushMock).toHaveBeenCalledWith('/user-dashboard');
  });

  it('TC-088 [S-01]: redirects to a safe in-app redirect param instead of the default dashboard', async () => {
    mockSearchParams = new URLSearchParams({ redirect: '/clubs' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-jwt-token' }),
    });

    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/clubs');
    });
  });

  it('TC-089 [S-01]: ignores an unsafe (external/protocol-relative) redirect param and falls back to /user-dashboard', async () => {
    mockSearchParams = new URLSearchParams({ redirect: '//evil.example.com' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-jwt-token' }),
    });

    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/user-dashboard');
    });
  });

  it('TC-090 [S-01]: shows the server-provided error message when login fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email or password' }),
    });

    render(<LoginPage />);
    fillAndSubmit();

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('TC-091 [S-01]: shows a generic error message when the request fails outright', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<LoginPage />);
    fillAndSubmit();

    expect(await screen.findByText('An error occurred. Please try again later.')).toBeInTheDocument();
  });
});
