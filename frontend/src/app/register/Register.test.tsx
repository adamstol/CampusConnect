import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from './page';

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Covers RTM: S-01 (Register for a new account and log into the system) -- signup half.
describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  function fillForm({
    firstName = 'Jane',
    lastName = 'Doe',
    email = 'jane@school.edu',
    password = 'Valid123!',
    confirmPassword = 'Valid123!',
  } = {}) {
    fireEvent.change(screen.getByLabelText('First Name'), { target: { name: 'firstName', value: firstName } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { name: 'lastName', value: lastName } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: password } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { name: 'confirmPassword', value: confirmPassword } });
  }

  it('TC-081 [S-01]: renders all signup fields and the submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('TC-082 [S-01]: shows a mismatch message and does not call the API when passwords differ', async () => {
    render(<RegisterPage />);
    fillForm({ password: 'Valid123!', confirmPassword: 'Different456!' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('TC-083 [S-01]: on success, shows the confirmation message and a Verify My Email link', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful! Please verify your email.' }),
    });

    render(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Registration successful! Please verify your email.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Verify My Email' })).toHaveAttribute('href', '/verify-email');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/auth/register',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('TC-084 [S-01]: shows the server-provided message when registration fails (e.g. duplicate email)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already registered' }),
    });

    render(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Verify My Email' })).not.toBeInTheDocument();
  });

  it('TC-085 [S-01]: shows a generic error message when the request fails outright', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('An error occurred. Please try again later.')).toBeInTheDocument();
  });
});
