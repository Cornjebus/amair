'use client';

import * as React from 'react';
import { Toast, ToastViewport, ToastProvider as RadixToastProvider } from './Toast';
import { ToastStateProvider, useToast } from '@/hooks/useToast';
import type { ToastPosition } from './Toast';

// =============================================================================
// Toast Container
// =============================================================================
// Internal component that renders all active toasts

function ToastContainer({ position }: { position: ToastPosition }) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          dismissible={toast.dismissible}
          action={toast.action}
          onClose={() => dismiss(toast.id)}
        />
      ))}
      <ToastViewport position={position} />
    </>
  );
}

// =============================================================================
// Combined Toast Provider
// =============================================================================

export interface CombinedToastProviderProps {
  children: React.ReactNode;
  /** Position of toast notifications */
  position?: ToastPosition;
  /** Maximum number of visible toasts */
  maxToasts?: number;
  /** Swipe direction for dismissing */
  swipeDirection?: 'right' | 'left' | 'up' | 'down';
  /** Default duration in ms (0 for persistent) */
  duration?: number;
}

export function CombinedToastProvider({
  children,
  position = 'bottom-right',
  swipeDirection = 'right',
  duration = 5000,
}: CombinedToastProviderProps) {
  return (
    <ToastStateProvider>
      <RadixToastProvider
        swipeDirection={swipeDirection}
        duration={duration}
      >
        {children}
        <ToastContainer position={position} />
      </RadixToastProvider>
    </ToastStateProvider>
  );
}

// Default export for convenience
export { CombinedToastProvider as ToastProviderWithViewport };
