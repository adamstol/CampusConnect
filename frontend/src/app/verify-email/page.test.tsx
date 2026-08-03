import { act, render, screen, fireEvent } from '@testing-library/react';
import VerifyEmailPage from './page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-01 (Register for a new account and log into the system) -- email verification step.
describe('VerifyEmailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  function submitToken(token = 'abc123token') {
    fireEvent.change(screen.getByLabelText('Verification Token'), { target: { value: token } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }));
  }

  it('TC-101 [S-01]: renders the verification token field and the Verify Email button', () => {
    render(<VerifyEmailPage />);
    expect(screen.getByLabelText('Verification Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify Email' })).toBeInTheDocument();
  });

  it('TC-102 [S-01]: on success, shows the confirmation and redirects to /login after 3 seconds', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email verified successfully!' }),
    });

    render(<VerifyEmailPage />);
    submitToken();

    expect(await screen.findByText('Email verified successfully!')).toBeInTheDocument();
    expect(screen.getByText('Redirecting you to login...')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
    expect(pushMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(pushMock).toHaveBeenCalledWith('/login');

    jest.useRealTimers();
  });

  it('TC-103 [S-01]: shows the server-provided message and stays on the form when verification fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'This verification link has expired.' }),
    });

    render(<VerifyEmailPage />);
    submitToken();

    expect(await screen.findByText('This verification link has expired.')).toBeInTheDocument();
    expect(screen.getByLabelText('Verification Token')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('TC-104 [S-01]: shows a generic error message when the request fails outright', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<VerifyEmailPage />);
    submitToken();

    expect(await screen.findByText('An error occurred. Please try again later.')).toBeInTheDocument();
  });
});
