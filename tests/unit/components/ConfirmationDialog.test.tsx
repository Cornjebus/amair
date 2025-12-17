import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  UnsavedChangesDialog,
} from '@/components/ui/ConfirmationDialog';

// =============================================================================
// ConfirmationDialog Tests
// =============================================================================

describe('ConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when open is true', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<ConfirmationDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('renders with custom labels', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmLabel="Yes, do it"
          cancelLabel="No, go back"
        />
      );

      expect(screen.getByRole('button', { name: 'Yes, do it' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No, go back' })).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <ConfirmationDialog {...defaultProps}>
          <div>Additional content</div>
        </ConfirmationDialog>
      );

      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });

    it('renders custom icon', () => {
      const CustomIcon = () => <span data-testid="custom-icon">Icon</span>;

      render(
        <ConfirmationDialog {...defaultProps} icon={<CustomIcon />} />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders danger variant correctly', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('renders warning variant correctly', () => {
      render(<ConfirmationDialog {...defaultProps} variant="warning" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-amber-600');
    });

    it('renders info variant correctly', () => {
      render(<ConfirmationDialog {...defaultProps} variant="info" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-blue-600');
    });
  });

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn();

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();

      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('calls onOpenChange(false) when cancel button is clicked', async () => {
      const onOpenChange = vi.fn();

      render(<ConfirmationDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes dialog after successful confirmation', async () => {
      const onOpenChange = vi.fn();
      const onConfirm = vi.fn().mockResolvedValue(undefined);

      render(
        <ConfirmationDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });

    it('disables buttons during async confirmation', async () => {
      const onConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('handles confirmation error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onConfirm = vi.fn().mockRejectedValue(new Error('Failed'));

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});

// =============================================================================
// DeleteConfirmationDialog Tests
// =============================================================================

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders with default delete messaging', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /delete this item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders with custom item name', () => {
    render(<DeleteConfirmationDialog {...defaultProps} itemName="the story" />);

    expect(screen.getByRole('heading', { name: /delete the story/i })).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('has danger variant styling', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toHaveClass('bg-red-600');
  });

  it('renders with custom title', () => {
    render(
      <DeleteConfirmationDialog
        {...defaultProps}
        title="Remove Profile?"
      />
    );

    expect(screen.getByText('Remove Profile?')).toBeInTheDocument();
  });
});

// =============================================================================
// UnsavedChangesDialog Tests
// =============================================================================

describe('UnsavedChangesDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders with default unsaved changes messaging', () => {
    render(<UnsavedChangesDialog {...defaultProps} />);

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
  });

  it('renders Leave and Stay buttons', () => {
    render(<UnsavedChangesDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  it('has warning variant styling', () => {
    render(<UnsavedChangesDialog {...defaultProps} />);

    const leaveButton = screen.getByRole('button', { name: 'Leave' });
    expect(leaveButton).toHaveClass('bg-amber-600');
  });

  it('renders with custom messaging', () => {
    render(
      <UnsavedChangesDialog
        {...defaultProps}
        title="Discard Draft?"
        description="Your story draft will be lost."
      />
    );

    expect(screen.getByText('Discard Draft?')).toBeInTheDocument();
    expect(screen.getByText('Your story draft will be lost.')).toBeInTheDocument();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('ConfirmationDialog accessibility', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
    onConfirm: vi.fn(),
  };

  it('has proper heading hierarchy', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Confirm Action');
  });

  it('buttons are keyboard accessible', async () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    expect(confirmButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();

    // Tab to confirm button
    confirmButton.focus();
    expect(document.activeElement).toBe(confirmButton);
  });
});
