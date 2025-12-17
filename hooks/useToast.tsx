'use client';

import * as React from 'react';
import type { ToastVariant } from '@/components/ui/Toast/Toast';

// =============================================================================
// Types
// =============================================================================

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    altText?: string;
  };
}

export interface ToastOptions extends Omit<ToastData, 'id'> {
  id?: string;
}

interface ToastContextValue {
  toasts: ToastData[];
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// =============================================================================
// Context
// =============================================================================

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 5;

// =============================================================================
// ID Generator
// =============================================================================

let toastCounter = 0;

function generateToastId(): string {
  return `toast-${++toastCounter}-${Date.now()}`;
}

// =============================================================================
// Toast State Reducer
// =============================================================================

type ToastAction =
  | { type: 'ADD_TOAST'; toast: ToastData }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'REMOVE_ALL' };

function toastReducer(state: ToastData[], action: ToastAction): ToastData[] {
  switch (action.type) {
    case 'ADD_TOAST': {
      // Check for duplicate ID
      const existingIndex = state.findIndex((t) => t.id === action.toast.id);
      if (existingIndex !== -1) {
        // Update existing toast instead of adding duplicate
        const newState = [...state];
        newState[existingIndex] = action.toast;
        return newState;
      }
      // Add new toast, limit to MAX_TOASTS
      const newState = [action.toast, ...state];
      return newState.slice(0, MAX_TOASTS);
    }
    case 'REMOVE_TOAST':
      return state.filter((t) => t.id !== action.id);
    case 'REMOVE_ALL':
      return [];
    default:
      return state;
  }
}

// =============================================================================
// Toast Provider Component
// =============================================================================

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastStateProvider({ children }: ToastProviderProps) {
  const [toasts, dispatch] = React.useReducer(toastReducer, []);
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    // Clear any existing timeout
    const existingTimeout = timeoutRefs.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(id);
    }
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions): string => {
      const id = options.id || generateToastId();
      const duration = options.duration ?? DEFAULT_DURATION;

      const toastData: ToastData = {
        ...options,
        id,
        variant: options.variant || 'default',
        dismissible: options.dismissible ?? true,
      };

      dispatch({ type: 'ADD_TOAST', toast: toastData });

      // Set auto-dismiss timeout if duration > 0
      if (duration > 0) {
        // Clear any existing timeout for this ID
        const existingTimeout = timeoutRefs.current.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
          dismiss(id);
        }, duration);

        timeoutRefs.current.set(id, timeout);
      }

      return id;
    },
    [dismiss]
  );

  const dismissAll = React.useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    dispatch({ type: 'REMOVE_ALL' });
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      toast,
      dismiss,
      dismissAll,
    }),
    [toasts, toast, dismiss, dismissAll]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// =============================================================================
// useToast Hook
// =============================================================================

export function useToast() {
  const context = React.useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // Convenience methods
  const success = React.useCallback(
    (options: Omit<ToastOptions, 'variant'> | string) => {
      const opts = typeof options === 'string' ? { description: options } : options;
      return context.toast({ ...opts, variant: 'success' });
    },
    [context]
  );

  const error = React.useCallback(
    (options: Omit<ToastOptions, 'variant'> | string) => {
      const opts = typeof options === 'string' ? { description: options } : options;
      return context.toast({ ...opts, variant: 'error' });
    },
    [context]
  );

  const warning = React.useCallback(
    (options: Omit<ToastOptions, 'variant'> | string) => {
      const opts = typeof options === 'string' ? { description: options } : options;
      return context.toast({ ...opts, variant: 'warning' });
    },
    [context]
  );

  const info = React.useCallback(
    (options: Omit<ToastOptions, 'variant'> | string) => {
      const opts = typeof options === 'string' ? { description: options } : options;
      return context.toast({ ...opts, variant: 'info' });
    },
    [context]
  );

  const promise = React.useCallback(
    async <T,>(
      promiseFn: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: unknown) => string);
      }
    ): Promise<T> => {
      const id = context.toast({
        description: options.loading,
        variant: 'default',
        duration: 0, // Keep loading toast visible
      });

      try {
        const result = await promiseFn;
        context.dismiss(id);
        context.toast({
          description:
            typeof options.success === 'function'
              ? options.success(result)
              : options.success,
          variant: 'success',
        });
        return result;
      } catch (err) {
        context.dismiss(id);
        context.toast({
          description:
            typeof options.error === 'function' ? options.error(err) : options.error,
          variant: 'error',
        });
        throw err;
      }
    },
    [context]
  );

  return {
    ...context,
    success,
    error,
    warning,
    info,
    promise,
  };
}
