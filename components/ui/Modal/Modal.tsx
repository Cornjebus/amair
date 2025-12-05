'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, focusRing } from '@/lib/design/utils';
import { usePrefersReducedMotion } from '@/lib/accessibility';

// =============================================================================
// Modal Component
// =============================================================================
// Accessible modal dialog with animations and multiple sizes

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onOpenChange: (open: boolean) => void;
  /** Modal title for accessibility */
  title: string;
  /** Optional description */
  description?: string;
  /** Show close button */
  showCloseButton?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Children content */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  showCloseButton = true,
  size = 'md',
  children,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                transition={{ duration: 0.2 }}
                className={cn(
                  'fixed inset-0 z-50',
                  'bg-black/50 backdrop-blur-sm'
                )}
                onClick={closeOnOverlayClick ? undefined : (e) => e.stopPropagation()}
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content
              asChild
              forceMount
              onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
              onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-50',
                  '-translate-x-1/2 -translate-y-1/2',
                  'w-full p-6',
                  'bg-white dark:bg-neutral-900',
                  'rounded-2xl shadow-xl',
                  'border border-neutral-200 dark:border-neutral-800',
                  focusRing,
                  sizeClasses[size],
                  className
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-sm text-neutral-600 dark:text-neutral-400">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>

                  {showCloseButton && (
                    <Dialog.Close asChild>
                      <button
                        className={cn(
                          'p-1.5 rounded-lg',
                          'text-neutral-500 hover:text-neutral-700',
                          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          'transition-colors',
                          focusRing
                        )}
                        aria-label="Close dialog"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  )}
                </div>

                {/* Content */}
                <div>{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Modal Footer for action buttons
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 mt-6 pt-4',
        'border-t border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      {children}
    </div>
  );
}

// Confirmation Modal preset
export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  variant?: 'danger' | 'primary';
  /** Loading state */
  isLoading?: boolean;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Message to display */
  message: React.ReactNode;
}

export function ConfirmModal({
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  message,
  ...props
}: ConfirmModalProps) {
  return (
    <Modal size="sm" {...props}>
      <div className="text-neutral-600 dark:text-neutral-400">{message}</div>
      <ModalFooter>
        <Dialog.Close asChild>
          <button
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'text-neutral-700 hover:bg-neutral-100',
              'dark:text-neutral-300 dark:hover:bg-neutral-800',
              'transition-colors',
              focusRing
            )}
          >
            {cancelText}
          </button>
        </Dialog.Close>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium text-white',
            'transition-colors',
            focusRing,
            variant === 'danger'
              ? 'bg-error-main hover:bg-error-dark'
              : 'bg-primary-500 hover:bg-primary-600',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}
