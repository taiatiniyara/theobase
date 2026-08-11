import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumericKeypad } from '../numeric-keypad';

describe('NumericKeypad', () => {
  const props = {
    onNumber: vi.fn(),
    onDecimal: vi.fn(),
    onBackspace: vi.fn(),
    onEnter: vi.fn(),
  };

  it('renders digit keys 0-9', () => {
    render(<NumericKeypad {...props} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('calls onNumber with digit', () => {
    render(<NumericKeypad {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(props.onNumber).toHaveBeenCalledWith('5');
  });

  it('calls onEnter', () => {
    render(<NumericKeypad {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    expect(props.onEnter).toHaveBeenCalled();
  });

  it('calls onDecimal', () => {
    render(<NumericKeypad {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    expect(props.onDecimal).toHaveBeenCalled();
  });
});
