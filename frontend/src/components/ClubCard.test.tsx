import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClubCard from './ClubCard';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img src={props.src} alt={props.alt} />,
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

describe('ClubCard', () => {
  const baseProps = {
    id: 1,
    name: 'Chess Club',
    description: 'Weekly casual and competitive chess.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('renders the club name, description, and a placeholder icon when no logo is given', () => {
    render(<ClubCard {...baseProps} />);
    expect(screen.getByText('Chess Club')).toBeInTheDocument();
    expect(screen.getByText('Weekly casual and competitive chess.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the logo image when logoUrl is provided', () => {
    render(<ClubCard {...baseProps} logoUrl="/chess-logo.png" />);
    expect(screen.getByAltText('Chess Club logo')).toBeInTheDocument();
  });

  it('shows "Join Club" by default and "Joined" when initialJoined is true', () => {
    const { rerender } = render(<ClubCard {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Join Club' })).toBeInTheDocument();

    rerender(<ClubCard {...baseProps} initialJoined={true} />);
    expect(screen.getByRole('button', { name: 'Joined' })).toBeInTheDocument();
  });

  it('redirects to login when clicking Join Club with no access token', () => {
    render(<ClubCard {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join Club' }));

    expect(pushMock).toHaveBeenCalledWith('/login?redirect=/clubs');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('joins the club on confirm when a token is present, and updates the button', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ClubCard {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join Club' }));

    // Confirm modal should appear before any network call is made.
    expect(screen.getByText(/Join Chess Club\?/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    // Two "Join Club" buttons now exist: the card's own button, and the
    // modal's confirm button (confirmLabel="Join Club"). Click the second.
    fireEvent.click(screen.getAllByRole('button', { name: 'Join Club' })[1]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/clubs/1/join',
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer fake-token' },
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Joined' })).toBeInTheDocument();
    });
  });

  it('leaves the club on confirm when already joined', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ClubCard {...baseProps} initialJoined={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Joined' }));

    expect(screen.getByText(/Leave Chess Club\?/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Leave Club' })[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/clubs/1/leave',
        expect.objectContaining({ method: 'POST' })
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Join Club' })).toBeInTheDocument();
    });
  });

  it('leaves the join button in its current state if the network request fails', async () => {
    window.localStorage.setItem('access_token', 'fake-token');
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<ClubCard {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join Club' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Join Club' })[1]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    // Still shows "Join Club" -- the request failed, so `joined` never flips to true.
    expect(screen.getByRole('button', { name: 'Join Club' })).toBeInTheDocument();
  });
});
