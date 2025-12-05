'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Coins, Sparkles, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCredits } from '@/lib/design/utils';

// =============================================================================
// CreditBadge Component
// =============================================================================
// Displays credit balance with tier-appropriate styling and animations

const creditBadgeVariants = cva(
  // Base styles
  cn(
    'inline-flex items-center gap-2',
    'font-medium rounded-full',
    'transition-all duration-200'
  ),
  {
    variants: {
      variant: {
        // Default - Standard display
        default: cn(
          'bg-neutral-100 text-neutral-700',
          'dark:bg-neutral-800 dark:text-neutral-300',
          'border border-neutral-200 dark:border-neutral-700'
        ),
        // Primary - Emphasized
        primary: cn(
          'bg-primary-100 text-primary-700',
          'dark:bg-primary-900/50 dark:text-primary-300',
          'border border-primary-200 dark:border-primary-800'
        ),
        // Premium - Gold styling
        premium: cn(
          'bg-gradient-to-r from-accent-100 to-accent-200',
          'text-accent-800',
          'border border-accent-300',
          'shadow-sm'
        ),
        // Danger - Low credits warning
        danger: cn(
          'bg-error-light/20 text-error-dark',
          'dark:bg-error-dark/20 dark:text-error-light',
          'border border-error-main/30',
          'animate-pulse'
        ),
        // Success - Just added credits
        success: cn(
          'bg-success-light/20 text-success-dark',
          'dark:bg-success-dark/20 dark:text-success-light',
          'border border-success-main/30'
        ),
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
        xl: 'px-5 py-2 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface CreditBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof creditBadgeVariants> {
  /** Current credit balance */
  credits: number;
  /** Previous credits for change animation */
  previousCredits?: number;
  /** Show animated changes */
  animate?: boolean;
  /** Low credit threshold for warning */
  lowThreshold?: number;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Show trend indicator */
  showTrend?: boolean;
  /** Tier for special styling */
  tier?: 'free' | 'basic' | 'premium' | 'enterprise';
}

export function CreditBadge({
  className,
  variant: variantProp,
  size,
  credits,
  previousCredits,
  animate = true,
  lowThreshold = 5,
  showIcon = true,
  icon,
  showTrend = false,
  tier,
  ...props
}: CreditBadgeProps) {
  const [displayCredits, setDisplayCredits] = React.useState(credits);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Determine variant based on state
  const variant = React.useMemo(() => {
    if (variantProp) return variantProp;
    if (credits <= lowThreshold) return 'danger';
    if (tier === 'premium' || tier === 'enterprise') return 'premium';
    if (previousCredits !== undefined && credits > previousCredits) return 'success';
    return 'default';
  }, [variantProp, credits, lowThreshold, tier, previousCredits]);

  // Animate credit changes
  React.useEffect(() => {
    if (!animate || previousCredits === undefined) {
      setDisplayCredits(credits);
      return;
    }

    const diff = credits - previousCredits;
    if (diff === 0) return;

    setIsAnimating(true);
    const duration = Math.min(Math.abs(diff) * 50, 1000);
    const steps = Math.min(Math.abs(diff), 20);
    const stepValue = diff / steps;
    let current = previousCredits;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepValue;
      setDisplayCredits(Math.round(current));

      if (step >= steps) {
        clearInterval(interval);
        setDisplayCredits(credits);
        setIsAnimating(false);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [credits, previousCredits, animate]);

  // Get appropriate icon
  const getIcon = () => {
    if (icon) return icon;
    if (tier === 'premium' || tier === 'enterprise') {
      return <Sparkles className="h-4 w-4" />;
    }
    if (credits <= lowThreshold) {
      return <Zap className="h-4 w-4" />;
    }
    return <Coins className="h-4 w-4" />;
  };

  // Get trend indicator
  const getTrend = () => {
    if (!showTrend || previousCredits === undefined) return null;
    const diff = credits - previousCredits;
    if (diff === 0) return null;

    return diff > 0 ? (
      <TrendingUp className="h-3 w-3 text-success-main" />
    ) : (
      <TrendingDown className="h-3 w-3 text-error-main" />
    );
  };

  return (
    <div
      className={cn(creditBadgeVariants({ variant, size }), className)}
      role="status"
      aria-label={`${credits} credits available`}
      {...props}
    >
      {showIcon && (
        <span className="shrink-0" aria-hidden="true">
          {getIcon()}
        </span>
      )}

      <AnimatePresence mode="wait">
        <motion.span
          key={displayCredits}
          initial={animate && isAnimating ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="tabular-nums"
        >
          {formatCredits(displayCredits)}
        </motion.span>
      </AnimatePresence>

      <span className="text-current/60">credits</span>

      {getTrend()}
    </div>
  );
}

// Compact version for inline use
export function CreditBadgeInline({
  credits,
  className,
}: {
  credits: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        'text-primary-600 dark:text-primary-400',
        className
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      {formatCredits(credits)}
    </span>
  );
}
