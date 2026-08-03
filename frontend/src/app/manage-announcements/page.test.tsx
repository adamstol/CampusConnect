import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageAnnouncementsPage from './page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ resetTheme: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

jest.mock('@/components/ConfirmModal', () => {
  return function MockConfirmModal({ isOpen, onConfirm, confirmLabel }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    );
  };
});

describe('ManageAnnouncementsPage', () => {
  const mockClubs = [
    { club_id: 1, club_name: 'Chess Club', role: 'admin' },
  ];

  const mockAnnouncements = [
    {
      announcement_id: 101,
      club_id: 1,
      created_by: 1,
      title: 'First Post',
      body: 'Welcome members!',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Storage.prototype.getItem = jest.fn((key) =>
      key === 'access_token' ? 'fake-jwt-token' : null
    );
  });

  it('redirects to /login if no access token is present', async () => {
    (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);

    render(<ManageAnnouncementsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows empty state when user has no managed clubs', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    render(<ManageAnnouncementsPage />);

    expect(await screen.findByText('No managed clubs')).toBeInTheDocument();
  });

  it('handles 401 unauthorized response by clearing storage and redirecting', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    render(<ManageAnnouncementsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});