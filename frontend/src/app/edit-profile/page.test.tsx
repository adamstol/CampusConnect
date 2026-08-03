import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfilePage from './page';

const pushMock = jest.fn();
const resetThemeMock = jest.fn();
// IMPORTANT: return the SAME object reference on every call, matching real
// Next.js's memoized router. A fresh object literal per call was the actual
// bug here -- it made `router` a new dependency on every render, which
// cascaded through handleUnauthorized -> loadProfile -> the mount useEffect,
// re-firing loadProfile (and its fetch) on every re-render.
const routerMock = { push: pushMock };

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ resetTheme: resetThemeMock, language: 'en' }),
}));

// Mocked to return the translation key itself, so assertions don't depend
// on the actual copy in @/lib/translations.
jest.mock('@/lib/translations', () => ({
  t: (_lang: string, key: string) => key,
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-02 (View and update their profile information)
describe('EditProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  const profileResponse = {
    ok: true,
    json: async () => ({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@school.edu',
      notify_in_app: true,
      notify_email: false,
    }),
  };

  it('TC-105 [S-02]: redirects to /login without fetching a profile when no access token is present', async () => {
    render(<EditProfilePage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('TC-106 [S-02]: loads and displays the current profile when a token is present', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce(profileResponse);

    render(<EditProfilePage />);

    expect(await screen.findByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@school.edu')).toBeInTheDocument();
  });

  it('TC-107 [S-02]: shows an error message when the profile fetch fails (non-401)', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    render(<EditProfilePage />);

    expect(await screen.findByText('Unable to load your profile.')).toBeInTheDocument();
  });

  it('TC-108 [S-02]: clears the token and redirects to /login when the profile fetch returns 401', async () => {
    window.localStorage.setItem('access_token', 'stale-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    render(<EditProfilePage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
    expect(resetThemeMock).toHaveBeenCalled();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('TC-109 [S-02]: submitting valid changes calls PATCH /auth/profile and shows the success message', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(profileResponse)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ message: 'Profile updated successfully.' }) });

    render(<EditProfilePage />);
    await screen.findByDisplayValue('Jane');

    fireEvent.change(screen.getByLabelText('fieldLastName'), { target: { name: 'last_name', value: 'Milo' } });
    fireEvent.click(screen.getByRole('button', { name: 'saveChanges' }));

    expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:5000/auth/profile',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('TC-110 [S-02]: shows a validation message and skips the API call when a required field is cleared', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce(profileResponse);

    render(<EditProfilePage />);
    await screen.findByDisplayValue('Jane');

    fireEvent.change(screen.getByLabelText('fieldFirstName'), { target: { name: 'first_name', value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'saveChanges' }));

    expect(await screen.findByText('First name, last name, and email are required.')).toBeInTheDocument();
    // Only the initial profile-load fetch happened -- no second (PATCH) call.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('TC-111 [S-02]: toggling a notification preference calls PATCH with just that key and shows a saved message', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(profileResponse)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    render(<EditProfilePage />);
    await screen.findByDisplayValue('Jane');

    fireEvent.click(screen.getByRole('button', { name: 'inAppNotifications' }));

    expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:5000/auth/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ notify_in_app: false }),
      })
    );
  });
});