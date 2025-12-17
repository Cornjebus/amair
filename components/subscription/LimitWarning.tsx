'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, XCircle, X, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/design/utils';

// =============================================================================
// Types
// =============================================================================

export type LimitType = 'stories' | 'premium-voices' | 'children' | 'saved-stories';

export interface LimitWarningProps {
  /** Current usage count */
  current: number;
  /** Maximum limit */
  limit: number;
  /** Type of limit being warned about */
  type: LimitType;
  /** Override automatic visibility with forceShow */
  forceShow?: boolean;
  /** Threshold percentage (0-1) at which to show warning. Default: 0.2 (20% remaining) */
  threshold?: number;
  /** Custom warning message (overrides default) */
  message?: string;
  /** Whether the warning can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Callback when upgrade is clicked */
  onUpgradeClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Label Configuration
// =============================================================================

const typeLabels: Record<LimitType, { singular: string; plural: string }> = {
  stories: { singular: 'story', plural: 'stories' },
  'premium-voices': { singular: 'premium voice', plural: 'premium voices' },
  children: { singular: 'child profile', plural: 'child profiles' },
  'saved-stories': { singular: 'saved story', plural: 'saved stories' },
};

// =============================================================================
// LimitWarning Component
// =============================================================================

export function LimitWarning({
  current,
  limit,
  type,
  forceShow = false,
  threshold = 0.2,
  message,
  dismissible = true,
  onDismiss,
  onUpgradeClick,
  className,
}: LimitWarningProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const remaining = Math.max(0, limit - current);
  const percentRemaining = limit > 0 ? remaining / limit : 0;
  const isAtLimit = remaining === 0;
  const isNearLimit = percentRemaining <= threshold && remaining > 0;

  // Determine if we should show
  const shouldShow = forceShow || isAtLimit || isNearLimit;

  if (!shouldShow || isDismissed) {
    return null;
  }

  const labels = typeLabels[type];
  const itemLabel = remaining === 1 ? labels.singular : labels.plural;

  const defaultMessage = isAtLimit
    ? `You've reached your ${labels.plural} limit for this month.`
    : `${remaining} ${itemLabel} remaining this month.`;

  const displayMessage = message || defaultMessage;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  const variant = isAtLimit ? 'critical' : 'warning';
  const Icon = isAtLimit ? XCircle : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-center gap-3 rounded-lg border px-4 py-3',
        'transition-all duration-200',
        variant === 'critical' && [
          'bg-error-light border-error-main/30 text-error-dark',
          'dark:bg-error-dark/20 dark:border-error-main/50 dark:text-error-light',
        ],
        variant === 'warning' && [
          'bg-warning-light border-warning-main/30 text-warning-dark',
          'dark:bg-warning-dark/20 dark:border-warning-main/50 dark:text-warning-light',
        ],
        className
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          variant === 'critical' && 'text-error-main',
          variant === 'warning' && 'text-warning-main'
        )}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isAtLimit ? 'Limit Reached' : 'Running Low'}
        </p>
        <p className="text-sm opacity-90">{displayMessage}</p>
      </div>

      <Link
        href="/pricing"
        onClick={handleUpgradeClick}
        className={cn(
          'inline-flex items-center gap-1 shrink-0',
          'rounded-md px-3 py-1.5 text-sm font-medium',
          'transition-colors',
          variant === 'critical' && [
            'bg-error-main text-white hover:bg-error-dark',
          ],
          variant === 'warning' && [
            'bg-warning-main text-warning-dark hover:bg-warning-dark hover:text-white',
          ],
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          variant === 'critical' && 'focus:ring-error-main',
          variant === 'warning' && 'focus:ring-warning-main'
        )}
      >
        Upgrade
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss warning"
          className={cn(
            'absolute -right-2 -top-2 rounded-full p-1',
            'bg-neutral-100 text-neutral-500',
            'hover:bg-neutral-200 hover:text-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Preset Warning Components
// =============================================================================

export function StoryLimitWarning(
  props: Omit<LimitWarningProps, 'type'>
) {
  return <LimitWarning {...props} type="stories" />;
}

export function PremiumVoiceLimitWarning(
  props: Omit<LimitWarningProps, 'type'>
) {
  return <LimitWarning {...props} type="premium-voices" />;
}
