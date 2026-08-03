import { render, screen, fireEvent } from '@testing-library/react';
import ResetPasswordPage from './page';

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-01 (Register for a new account and log into the system) -- password-reset completion step.
describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  function fillForm({ token = '  abc123token  ', password = 'NewValid123!', confirmPassword = 'NewValid123!' } = {}) {
    fireEvent.change(screen.getByLabelText('Reset Token'), { target: { name: 'token', value: token } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { name: 'password', value: password } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { name: 'confirmPassword', value: confirmPassword } });
  }

  it('TC-096 [S-01]: renders the token, new password, and confirm password fields and the submit button', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('Reset Token')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('TC-097 [S-01]: shows a mismatch message and skips the API call when passwords differ', async () => {
    render(<ResetPasswordPage />);
    fillForm({ password: 'NewValid123!', confirmPassword: 'Different456!' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('TC-098 [S-01]: on success, sends a trimmed token and shows the confirmation with a Go to Login link', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successfully!' }),
    });

    render(<ResetPasswordPage />);
    fillForm({ token: '  abc123token  ' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Password reset successfully!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'abc123token', password: 'NewValid123!' }),
      })
    );
  });

  it('TC-099 [S-01]: shows the server-provided message when the reset fails (e.g. expired token)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'This reset token has expired.' }),
    });

    render(<ResetPasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('This reset token has expired.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to Login' })).not.toBeInTheDocument();
  });

  it('TC-100 [S-01]: shows a generic error message when the request fails outright', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<ResetPasswordPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('An error occurred. Please try again later.')).toBeInTheDocument();
  });
});
