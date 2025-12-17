import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import React from 'react';

import {
  Toast,
  ToastViewport,
  CombinedToastProvider,
  useToast,
  ToastStateProvider
} from '@/components/ui/Toast';
import * as ToastPrimitive from '@radix-ui/react-toast';

// =============================================================================
// Test Wrapper
// =============================================================================

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CombinedToastProvider position="bottom-right">
    {children}
  </CombinedToastProvider>
);

// Helper component to trigger toasts
function ToastTrigger({
  options,
  method = 'toast'
}: {
  options: Parameters<ReturnType<typeof useToast>['toast']>[0] | string;
  method?: 'toast' | 'success' | 'error' | 'warning' | 'info';
}) {
  const toast = useToast();

  return (
    <button
      onClick={() => {
        if (method === 'toast') {
          toast.toast(options as Parameters<typeof toast.toast>[0]);
        } else {
          toast[method](options);
        }
      }}
      data-testid="trigger"
    >
      Trigger Toast
    </button>
  );
}

// =============================================================================
// Toast Component Tests
// =============================================================================

describe('Toast Component', () => {
  describe('Rendering', () => {
    it('renders toast with message via useToast', async () => {
      const user = userEvent.setup();
      const message = 'Operation completed successfully';

      render(
        <TestWrapper>
          <ToastTrigger options={{ description: message }} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });
    });

    it('renders toast with title and description', async () => {
      const user = userEvent.setup();
      const title = 'Success';
      const description = 'Your story has been saved';

      render(
        <TestWrapper>
          <ToastTrigger options={{ title, description }} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
      });
    });

    it('supports success variant', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Success message" method="success" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });

    it('supports error variant', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Error occurred" method="error" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('supports warning variant', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Warning message" method="warning" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Warning message')).toBeInTheDocument();
      });
    });

    it('supports info variant', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Info message" method="info" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('shows action button when provided', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();

      render(
        <TestWrapper>
          <ToastTrigger
            options={{
              description: 'Test message',
              action: { label: 'Undo', onClick: onAction }
            }}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
      });
    });

    it('calls action callback when action button clicked', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();

      render(
        <TestWrapper>
          <ToastTrigger
            options={{
              description: 'Test message',
              action: { label: 'Undo', onClick: onAction }
            }}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Undo'));

      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('Manual Dismiss', () => {
    it('shows close button by default', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options={{ description: 'Test message' }} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });
    });

    it('can be manually dismissed by clicking close button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options={{ description: 'Test message', duration: 0 }} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible role for important messages', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Error occurred" method="error" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('has role="status" for informational messages', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options="Info message" method="info" />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('close button has accessible aria-label', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ToastTrigger options={{ description: 'Test' }} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
      });
    });
  });
});

// =============================================================================
// useToast Hook Tests
// =============================================================================

describe('useToast Hook', () => {
  describe('Toast Management', () => {
    it('adds toast to queue', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.toast({ description: 'Test' });
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('removes toast by id', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      let toastId: string;
      act(() => {
        toastId = result.current.toast({ description: 'Test', id: 'test-id' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('clears all toasts', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.toast({ description: 'Test 1' });
        result.current.toast({ description: 'Test 2' });
        result.current.toast({ description: 'Test 3' });
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.dismissAll();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('prevents duplicate toasts with same id', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.toast({ description: 'Test 1', id: 'same-id' });
        result.current.toast({ description: 'Test 2', id: 'same-id' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].description).toBe('Test 2');
    });

    it('limits max visible toasts to 5', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toast({ description: `Test ${i}` });
        }
      });

      expect(result.current.toasts).toHaveLength(5);
    });
  });

  describe('Convenience Methods', () => {
    it('provides toast.success() shorthand', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts[0].variant).toBe('success');
      expect(result.current.toasts[0].description).toBe('Success message');
    });

    it('provides toast.error() shorthand', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.error('Error message');
      });

      expect(result.current.toasts[0].variant).toBe('error');
    });

    it('provides toast.warning() shorthand', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.warning('Warning message');
      });

      expect(result.current.toasts[0].variant).toBe('warning');
    });

    it('provides toast.info() shorthand', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => (
          <ToastStateProvider>{children}</ToastStateProvider>
        ),
      });

      act(() => {
        result.current.info('Info message');
      });

      expect(result.current.toasts[0].variant).toBe('info');
    });
  });
});

// =============================================================================
// ToastProvider Tests
// =============================================================================

describe('ToastProvider', () => {
  it('provides toast context to children', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => (
        <ToastStateProvider>{children}</ToastStateProvider>
      ),
    });

    expect(result.current.toast).toBeDefined();
    expect(result.current.dismiss).toBeDefined();
    expect(result.current.dismissAll).toBeDefined();
  });

  it('throws error when useToast used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Toast Integration', () => {
  it('works with real user interaction flow', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ToastTrigger options={{ title: 'Saved', description: 'Your story is saved!' }} />
      </TestWrapper>
    );

    // Trigger toast
    await user.click(screen.getByTestId('trigger'));

    // See message
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Your story is saved!')).toBeInTheDocument();
    });

    // Dismiss
    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    });
  });

  it('handles rapid successive toasts', async () => {
    const user = userEvent.setup();

    function MultiToastTrigger() {
      const { toast } = useToast();
      return (
        <button
          onClick={() => {
            toast({ description: 'Toast 1' });
            toast({ description: 'Toast 2' });
            toast({ description: 'Toast 3' });
          }}
          data-testid="multi-trigger"
        >
          Trigger Multiple
        </button>
      );
    }

    render(
      <TestWrapper>
        <MultiToastTrigger />
      </TestWrapper>
    );

    await user.click(screen.getByTestId('multi-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });
});
