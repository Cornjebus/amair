'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'default';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

// =============================================================================
// Variant Configuration
// =============================================================================

const variantConfig: Record<
  ConfirmationVariant,
  {
    icon: React.ElementType;
    iconBgClass: string;
    iconClass: string;
    confirmButtonClass: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconBgClass: 'bg-red-100',
    iconClass: 'text-red-600',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBgClass: 'bg-amber-100',
    iconClass: 'text-amber-600',
    confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: AlertCircle,
    iconBgClass: 'bg-blue-100',
    iconClass: 'text-blue-600',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  default: {
    icon: HelpCircle,
    iconBgClass: 'bg-amari-sage/20',
    iconClass: 'text-amari-sage',
    confirmButtonClass: '',
  },
};

// =============================================================================
// ConfirmationDialog Component
// =============================================================================

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
  icon,
  children,
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done by the caller
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const loading = isLoading || isConfirming;

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn('p-3 rounded-full shrink-0', config.iconBgClass)}>
              {icon || <IconComponent className={cn('h-6 w-6', config.iconClass)} />}
            </div>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-amari-charcoal">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm text-amari-muted">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Optional additional content */}
        {children && <div className="mt-4">{children}</div>}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn('flex-1', config.confirmButtonClass)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Preset Dialog Components
// =============================================================================

export interface DeleteConfirmationDialogProps
  extends Omit<ConfirmationDialogProps, 'variant' | 'title'> {
  itemName?: string;
  title?: string;
}

export function DeleteConfirmationDialog({
  itemName = 'this item',
  title = `Delete ${itemName}?`,
  description = `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
  confirmLabel = 'Delete',
  ...props
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      {...props}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant="danger"
    />
  );
}

export interface UnsavedChangesDialogProps
  extends Omit<ConfirmationDialogProps, 'variant' | 'title' | 'description'> {
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  title = 'Unsaved Changes',
  description = 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
  confirmLabel = 'Leave',
  cancelLabel = 'Stay',
  ...props
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmationDialog
      {...props}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant="warning"
    />
  );
}
