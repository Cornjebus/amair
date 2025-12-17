import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConfirmationProvider,
  useConfirmation,
  useConfirmDialog,
} from '@/hooks/useConfirmation';

// =============================================================================
// Test Components
// =============================================================================

function TestComponent() {
  const { confirm, confirmDelete, confirmAction } = useConfirmation();
  const [result, setResult] = React.useState<string>('');

  const handleConfirm = async () => {
    const confirmed = await confirm({
      title: 'Test Confirmation',
      description: 'Are you sure?',
    });
    setResult(confirmed ? 'confirmed' : 'cancelled');
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete('test item');
    setResult(confirmed ? 'deleted' : 'cancelled');
  };

  const handleAction = async () => {
    const confirmed = await confirmAction({
      title: 'Custom Action',
      description: 'This will perform an action',
      variant: 'warning',
      onConfirm: () => setResult('action performed'),
    });
    if (!confirmed) setResult('action cancelled');
  };

  return (
    <div>
      <button onClick={handleConfirm}>Open Confirm</button>
      <button onClick={handleDelete}>Open Delete</button>
      <button onClick={handleAction}>Open Action</button>
      <div data-testid="result">{result}</div>
    </div>
  );
}

function TestStandaloneComponent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [result, setResult] = React.useState<string>('');

  const handleConfirm = async () => {
    const confirmed = await confirm({
      title: 'Standalone Confirm',
      description: 'This uses the standalone hook',
    });
    setResult(confirmed ? 'confirmed' : 'cancelled');
  };

  return (
    <div>
      <button onClick={handleConfirm}>Open Dialog</button>
      <div data-testid="result">{result}</div>
      <ConfirmDialog />
    </div>
  );
}

// =============================================================================
// ConfirmationProvider Tests
// =============================================================================

describe('ConfirmationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('confirm', () => {
    it('opens confirmation dialog', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));

      expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('resolves true when confirmed', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
      });
    });

    it('resolves false when cancelled', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
      });
    });
  });

  describe('confirmDelete', () => {
    it('opens delete confirmation with item name', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Delete' }));

      expect(screen.getByRole('heading', { name: /delete test item/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('has danger variant styling', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Delete' }));

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveClass('bg-red-600');
    });

    it('resolves true when deletion confirmed', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('deleted');
      });
    });
  });

  describe('confirmAction', () => {
    it('opens with custom options', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Action' }));

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.getByText('This will perform an action')).toBeInTheDocument();
    });

    it('calls onConfirm callback when confirmed', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Action' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('action performed');
      });
    });

    it('does not call onConfirm when cancelled', async () => {
      render(
        <ConfirmationProvider>
          <TestComponent />
        </ConfirmationProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Open Action' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('action cancelled');
      });
    });
  });

  describe('error handling', () => {
    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useConfirmation must be used within a ConfirmationProvider'
      );

      consoleError.mockRestore();
    });
  });
});

// =============================================================================
// useConfirmDialog Hook Tests
// =============================================================================

describe('useConfirmDialog (standalone)', () => {
  it('renders ConfirmDialog component', async () => {
    render(<TestStandaloneComponent />);

    await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));

    expect(screen.getByText('Standalone Confirm')).toBeInTheDocument();
  });

  it('resolves true when confirmed', async () => {
    render(<TestStandaloneComponent />);

    await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
    });
  });

  it('resolves false when cancelled', async () => {
    render(<TestStandaloneComponent />);

    await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Confirmation flow integration', () => {
  it('handles multiple sequential confirmations', async () => {
    render(
      <ConfirmationProvider>
        <TestComponent />
      </ConfirmationProvider>
    );

    // First confirmation - confirm
    await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
    });

    // Second confirmation - cancel
    await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
    });
  });

  it('handles different dialog types in sequence', async () => {
    render(
      <ConfirmationProvider>
        <TestComponent />
      </ConfirmationProvider>
    );

    // Regular confirm
    await userEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
    });

    // Delete confirm
    await userEvent.click(screen.getByRole('button', { name: 'Open Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('deleted');
    });
  });
});
