import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  const baseProps = {
    title: 'Join Club',
    message: 'Join Chess Club? You will receive announcements.',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, message, and default button labels when open', () => {
    render(<ConfirmModal {...baseProps} isOpen={true} />);
    expect(screen.getByText('Join Club')).toBeInTheDocument();
    expect(screen.getByText('Join Chess Club? You will receive announcements.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom confirm/cancel labels when provided', () => {
    render(
      <ConfirmModal
        {...baseProps}
        isOpen={true}
        confirmLabel="Leave Club"
        cancelLabel="Stay"
      />
    );
    expect(screen.getByRole('button', { name: 'Leave Club' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    render(<ConfirmModal {...baseProps} isOpen={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when the cancel button is clicked', () => {
    render(<ConfirmModal {...baseProps} isOpen={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when clicking the backdrop, but not when clicking inside the modal', () => {
    render(<ConfirmModal {...baseProps} isOpen={true} />);
    fireEvent.click(screen.getByText('Join Chess Club? You will receive announcements.'));
    expect(baseProps.onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Join Club').closest('div.fixed')!);
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
