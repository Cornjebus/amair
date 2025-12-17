'use client';

import * as React from 'react';
import {
  ConfirmationDialog,
  ConfirmationVariant,
} from '@/components/ui/ConfirmationDialog';

// =============================================================================
// Types
// =============================================================================

export interface ConfirmationOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  onCancel?: () => void;
}

interface ConfirmationState extends ConfirmationOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  confirmDelete: (itemName: string, onConfirm?: () => void | Promise<void>) => Promise<boolean>;
  confirmAction: (options: ConfirmationOptions & { onConfirm?: () => void | Promise<void> }) => Promise<boolean>;
}

// =============================================================================
// Context
// =============================================================================

const ConfirmationContext = React.createContext<ConfirmationContextValue | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export interface ConfirmationProviderProps {
  children: React.ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [state, setState] = React.useState<ConfirmationState>({
    open: false,
    title: '',
    description: undefined,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    resolve: null,
    onCancel: undefined,
  });

  const confirm = React.useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const confirmDelete = React.useCallback(
    async (itemName: string, onConfirm?: () => void | Promise<void>): Promise<boolean> => {
      const result = await confirm({
        title: `Delete ${itemName}?`,
        description: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger',
      });

      if (result && onConfirm) {
        await onConfirm();
      }

      return result;
    },
    [confirm]
  );

  const confirmAction = React.useCallback(
    async (options: ConfirmationOptions & { onConfirm?: () => void | Promise<void> }): Promise<boolean> => {
      const { onConfirm, ...confirmOptions } = options;
      const result = await confirm(confirmOptions);

      if (result && onConfirm) {
        await onConfirm();
      }

      return result;
    },
    [confirm]
  );

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    state.onCancel?.();
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const value = React.useMemo(
    () => ({
      confirm,
      confirmDelete,
      confirmAction,
    }),
    [confirm, confirmDelete, confirmAction]
  );

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmationContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useConfirmation(): ConfirmationContextValue {
  const context = React.useContext(ConfirmationContext);

  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }

  return context;
}

// =============================================================================
// Standalone hook for simple use cases (no provider needed)
// =============================================================================

export interface UseConfirmDialogReturn {
  isOpen: boolean;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  ConfirmDialog: React.FC;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = React.useState<ConfirmationState>({
    open: false,
    title: '',
    description: undefined,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    resolve: null,
    onCancel: undefined,
  });

  const confirm = React.useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    state.onCancel?.();
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const ConfirmDialog = React.useCallback(
    () => (
      <ConfirmationDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [state, handleOpenChange, handleConfirm, handleCancel]
  );

  return {
    isOpen: state.open,
    confirm,
    ConfirmDialog,
  };
}
