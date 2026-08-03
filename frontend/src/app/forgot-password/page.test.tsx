import { render, screen, fireEvent } from '@testing-library/react';
import ForgotPasswordPage from './page';

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-01 (Register for a new account and log into the system) -- password-reset request step.
describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  function submitEmail(email = 'jane@school.edu') {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
  }

  it('TC-092 [S-01]: renders the email field and the Send Reset Link button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('TC-093 [S-01]: on success, shows the confirmation message with Reset and Back-to-Login links', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'If an account exists for that email, a reset link has been sent.' }),
    });

    render(<ForgotPasswordPage />);
    submitEmail();

    // Check the submitted view landed first (most robust signal -- doesn't
    // depend on exact message text/whitespace), then the message itself.
    expect(await screen.findByRole('link', { name: 'Reset My Password' })).toHaveAttribute('href', '/reset-password');
    expect(screen.getByText((text) => text.includes('a reset link has been sent'))).toBeInTheDocument();
  });

  it('TC-094 [S-01]: on failure, shows the server-provided message and keeps the form visible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No account found for that email.' }),
    });

    render(<ForgotPasswordPage />);
    submitEmail();

    expect(await screen.findByText('No account found for that email.')).toBeInTheDocument();
    // Form should still be visible -- request wasn't successful, so `submitted` never flips.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Reset My Password' })).not.toBeInTheDocument();
  });

  it('TC-095 [S-01]: shows a generic error message when the request fails outright', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<ForgotPasswordPage />);
    submitEmail();

    expect(await screen.findByText('An error occurred. Please try again later.')).toBeInTheDocument();
  });
});