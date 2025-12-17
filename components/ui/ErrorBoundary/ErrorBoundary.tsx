'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  fallbackRender?: (props: FallbackProps) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
}

export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// =============================================================================
// ErrorBoundary Component (Class-based - required for error boundaries)
// =============================================================================

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeysChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasKeysChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    if (hasError && error) {
      // Custom fallback render function
      if (fallbackRender) {
        return fallbackRender({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      // Custom fallback component
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

// =============================================================================
// Default Error Fallback UI
// =============================================================================

export interface DefaultErrorFallbackProps extends FallbackProps {
  className?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
}

export function DefaultErrorFallback({
  error,
  resetErrorBoundary,
  className,
  showDetails = process.env.NODE_ENV === 'development',
  showHomeButton = true,
}: DefaultErrorFallbackProps) {
  return (
    <div
      className={cn(
        'min-h-[400px] flex items-center justify-center p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-4 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-amari-charcoal">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-amari-muted">
            We&apos;re sorry, but something unexpected happened. Don&apos;t worry, your
            data is safe.
          </p>

          {/* Error details in development */}
          {showDetails && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <Bug className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Error Details:</p>
                  <p className="text-red-700 break-words font-mono text-xs mt-1">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={resetErrorBoundary}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            {showHomeButton && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => (window.location.href = '/dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-amari-muted">
            If this keeps happening, please{' '}
            <a
              href="mailto:support@amari.com"
              className="text-amari-terracotta hover:underline"
            >
              contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Inline Error Fallback (smaller, for components)
// =============================================================================

export interface InlineErrorFallbackProps extends FallbackProps {
  className?: string;
}

export function InlineErrorFallback({
  error,
  resetErrorBoundary,
  className,
}: InlineErrorFallbackProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-red-50 border border-red-200',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">Something went wrong</p>
          <p className="text-sm text-red-600 mt-1">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetErrorBoundary}
            className="mt-2 text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// withErrorBoundary HOC
// =============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}

// =============================================================================
// useErrorHandler hook
// =============================================================================

export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
