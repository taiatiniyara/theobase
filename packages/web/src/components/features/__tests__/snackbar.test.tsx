import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Snackbar } from '../snackbar';

describe('Snackbar', () => {
  it('renders message', () => {
    render(<Snackbar message="Record removed." onDismiss={vi.fn()} />);
    expect(screen.getByText('Record removed.')).toBeInTheDocument();
  });

  it('renders undo button when onUndo provided', () => {
    render(<Snackbar message="Removed" onDismiss={vi.fn()} onUndo={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('calls onUndo and onDismiss when undo clicked', () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();
    render(<Snackbar message="Removed" onDismiss={onDismiss} onUndo={onUndo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
