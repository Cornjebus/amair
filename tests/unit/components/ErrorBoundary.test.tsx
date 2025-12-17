import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ErrorBoundary,
  DefaultErrorFallback,
  InlineErrorFallback,
  withErrorBoundary,
  useErrorHandler,
} from '@/components/ui/ErrorBoundary';

// =============================================================================
// Test Utilities
// =============================================================================

// Component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

// Component that throws an error on click
function ThrowOnClick() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Click triggered error');
  }

  return (
    <button onClick={() => setShouldThrow(true)}>
      Throw Error
    </button>
  );
}

// Component that uses useErrorHandler hook
function UseErrorHandlerTest() {
  const handleError = useErrorHandler();

  return (
    <button onClick={() => handleError(new Error('Hook triggered error'))}>
      Trigger Hook Error
    </button>
  );
}

// =============================================================================
// Mock console.error to avoid noisy test output
// =============================================================================

const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// =============================================================================
// ErrorBoundary Tests
// =============================================================================

describe('ErrorBoundary', () => {
  describe('basic functionality', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('renders default fallback when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('displays error message when showDetails is true', () => {
      render(
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <DefaultErrorFallback
              error={error}
              resetErrorBoundary={resetErrorBoundary}
              showDetails={true}
            />
          )}
        >
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback component when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('renders custom fallbackRender with error and reset props', () => {
      const fallbackRender = vi.fn(({ error, resetErrorBoundary }) => (
        <div>
          <span>Error: {error.message}</span>
          <button onClick={resetErrorBoundary}>Reset</button>
        </div>
      ));

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(fallbackRender).toHaveBeenCalled();
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('resets error state when Try Again is clicked', async () => {
      let shouldThrow = true;
      const TestWrapper = () => (
        <ErrorBoundary key={shouldThrow ? 'error' : 'no-error'}>
          {shouldThrow ? <ThrowError shouldThrow /> : <div>No error</div>}
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper />);

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Change state and rerender
      shouldThrow = false;

      // Click Try Again
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      rerender(<TestWrapper />);

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('calls onReset callback when resetting', () => {
      const onReset = vi.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('onError callback', () => {
    it('calls onError when an error is caught', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('resetKeys', () => {
    it('resets when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Change resetKeys
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// DefaultErrorFallback Tests
// =============================================================================

describe('DefaultErrorFallback', () => {
  it('renders error message', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        showDetails={true}
      />
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders Try Again button that calls resetErrorBoundary', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(resetErrorBoundary).toHaveBeenCalled();
  });

  it('renders Go to Dashboard button', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('hides home button when showHomeButton is false', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        showHomeButton={false}
      />
    );

    expect(screen.queryByRole('button', { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it('hides error details when showDetails is false', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        showDetails={false}
      />
    );

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('shows support contact link', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      'mailto:support@amari.com'
    );
  });
});

// =============================================================================
// InlineErrorFallback Tests
// =============================================================================

describe('InlineErrorFallback', () => {
  it('renders error message', () => {
    const error = new Error('Inline error');
    const resetErrorBoundary = vi.fn();

    render(
      <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Inline error')).toBeInTheDocument();
  });

  it('has correct ARIA role', () => {
    const error = new Error('Test');
    const resetErrorBoundary = vi.fn();

    render(
      <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders Retry button that calls resetErrorBoundary', () => {
    const error = new Error('Test');
    const resetErrorBoundary = vi.fn();

    render(
      <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(resetErrorBoundary).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const error = new Error('Test');
    const resetErrorBoundary = vi.fn();

    const { container } = render(
      <InlineErrorFallback
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

// =============================================================================
// withErrorBoundary HOC Tests
// =============================================================================

describe('withErrorBoundary', () => {
  it('wraps component with ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow />);

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});

// =============================================================================
// useErrorHandler Hook Tests
// =============================================================================

describe('useErrorHandler', () => {
  it('throws error when called', () => {
    render(
      <ErrorBoundary>
        <UseErrorHandlerTest />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger hook error/i }));

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });
});
