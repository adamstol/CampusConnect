import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordPage from './page';

const pushMock = jest.fn();
const resetThemeMock = jest.fn();
// Stable reference across renders -- see edit-profile-page.test.tsx for why
// a fresh object literal per call causes an effect-loop bug in tests.
const routerMock = { push: pushMock };

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ resetTheme: resetThemeMock, language: 'en' }),
}));

jest.mock('@/lib/translations', () => ({
  t: (_lang: string, key: string) => key,
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-02 (View and update their profile information) -- password change.
describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  function fillForm(password = 'NewValid123!', confirmPassword = 'NewValid123!') {
    fireEvent.change(screen.getByLabelText('fieldNewPassword'), { target: { name: 'password', value: password } });
    fireEvent.change(screen.getByLabelText('fieldConfirmPassword'), { target: { name: 'confirmPassword', value: confirmPassword } });
  }

  it('TC-112 [S-02]: redirects to /login when no access token is present', async () => {
    render(<ChangePasswordPage />);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('TC-113 [S-02]: renders the new password and confirm password fields and the submit button', () => {
    window.localStorage.setItem('access_token', 'fake-token');
    render(<ChangePasswordPage />);
    expect(screen.getByLabelText('fieldNewPassword')).toBeInTheDocument();
    expect(screen.getByLabelText('fieldConfirmPassword')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'updatePassword' })).toBeInTheDocument();
  });

  it('TC-114 [S-02]: shows a length validation message and skips the API call for a too-short password', () => {
    window.localStorage.setItem('access_token', 'fake-token');
    render(<ChangePasswordPage />);
    fillForm('short1', 'short1');
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('TC-115 [S-02]: shows a mismatch message and skips the API call when passwords differ', () => {
    window.localStorage.setItem('access_token', 'fake-token');
    render(<ChangePasswordPage />);
    fillForm('NewValid123!', 'Different456!');
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('TC-116 [S-02]: on success, calls PATCH with the new password, shows the success message, and clears the fields', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    render(<ChangePasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('Password changed successfully.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/auth/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ password: 'NewValid123!' }),
      })
    );
    expect(screen.getByLabelText('fieldNewPassword')).toHaveValue('');
    expect(screen.getByLabelText('fieldConfirmPassword')).toHaveValue('');
  });

  it('TC-117 [S-02]: shows the server-provided message when the change fails', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'New password cannot match a previous password.' }),
    });

    render(<ChangePasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('New password cannot match a previous password.')).toBeInTheDocument();
  });

  it('TC-118 [S-02]: clears the token and redirects to /login when the response is 401', async () => {
    window.localStorage.setItem('access_token', 'stale-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    render(<ChangePasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
    expect(resetThemeMock).toHaveBeenCalled();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('TC-119 [S-02]: shows a generic error message when the request fails outright', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<ChangePasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('Unable to change your password right now.')).toBeInTheDocument();
  });
});