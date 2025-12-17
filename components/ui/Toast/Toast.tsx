'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/design/utils';

// =============================================================================
// Toast Variants
// =============================================================================

const toastVariants = cva(
  cn(
    'group pointer-events-auto relative flex w-full items-center justify-between',
    'gap-4 overflow-hidden rounded-xl border-2 p-4 pr-10',
    'shadow-2xl backdrop-blur-none',
    'transition-all duration-300 ease-out',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0',
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
    'sm:data-[state=open]:slide-in-from-bottom-full'
  ),
  {
    variants: {
      variant: {
        default: cn(
          'border-gray-300 bg-white text-gray-900',
          'shadow-[0_10px_40px_rgba(0,0,0,0.15)]'
        ),
        success: cn(
          'border-green-400 bg-green-50 text-green-900',
          'shadow-[0_10px_40px_rgba(34,197,94,0.2)]'
        ),
        error: cn(
          'border-red-400 bg-red-50 text-red-900',
          'shadow-[0_10px_40px_rgba(239,68,68,0.2)]'
        ),
        warning: cn(
          'border-amber-400 bg-amber-50 text-amber-900',
          'shadow-[0_10px_40px_rgba(245,158,11,0.2)]'
        ),
        info: cn(
          'border-blue-400 bg-blue-50 text-blue-900',
          'shadow-[0_10px_40px_rgba(59,130,246,0.2)]'
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// =============================================================================
// Toast Types
// =============================================================================

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {
  /** Unique identifier for the toast */
  id?: string;
  /** Main toast title */
  title?: string;
  /** Toast description/message */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    altText?: string;
  };
  /** Whether toast can be dismissed */
  dismissible?: boolean;
  /** Callback when toast is closed */
  onClose?: () => void;
}

// =============================================================================
// Icon Map
// =============================================================================

const iconMap: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />,
};

// =============================================================================
// Toast Component
// =============================================================================

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(
  (
    {
      className,
      variant = 'default',
      title,
      description,
      action,
      dismissible = true,
      onClose,
      ...props
    },
    ref
  ) => {
    const icon = iconMap[variant || 'default'];
    const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        onOpenChange={(open) => {
          if (!open && onClose) {
            onClose();
          }
        }}
        {...props}
      >
        <div className="flex items-start gap-3" role={role} aria-live="polite">
          {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
          <div className="flex-1 space-y-1">
            {title && (
              <ToastPrimitive.Title className="text-sm font-semibold">
                {title}
              </ToastPrimitive.Title>
            )}
            {description && (
              <ToastPrimitive.Description className="text-sm opacity-90">
                {description}
              </ToastPrimitive.Description>
            )}
          </div>
        </div>

        {action && (
          <ToastPrimitive.Action
            className={cn(
              'inline-flex h-8 shrink-0 items-center justify-center',
              'rounded-lg border px-3 text-sm font-medium',
              'transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            altText={action.altText || action.label}
            onClick={action.onClick}
          >
            {action.label}
          </ToastPrimitive.Action>
        )}

        {dismissible && (
          <ToastPrimitive.Close
            className={cn(
              'absolute right-2 top-2 rounded-md p-1',
              'text-neutral-500 opacity-0 transition-opacity',
              'hover:text-neutral-900 dark:hover:text-neutral-50',
              'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500',
              'group-hover:opacity-100'
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </ToastPrimitive.Close>
        )}
      </ToastPrimitive.Root>
    );
  }
);

Toast.displayName = 'Toast';

// =============================================================================
// Toast Viewport
// =============================================================================

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-0 left-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0',
};

export interface ToastViewportProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> {
  position?: ToastPosition;
}

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  ToastViewportProps
>(({ className, position = 'bottom-right', ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed z-[9999] flex max-h-screen w-full flex-col-reverse gap-3 p-4',
      'sm:max-w-[420px]',
      positionClasses[position],
      className
    )}
    {...props}
  />
));

ToastViewport.displayName = 'ToastViewport';

// =============================================================================
// Re-export Radix primitives
// =============================================================================

export const ToastProvider = ToastPrimitive.Provider;
