'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Image,
  Mic,
  Video,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatCredits } from '@/lib/design/utils';
import { Card } from '@/components/ui/Card/Card';

// =============================================================================
// CostPreview Component
// =============================================================================
// Shows detailed breakdown of credit costs before generation

interface CostItem {
  label: string;
  icon: React.ReactNode;
  cost: number;
  description?: string;
  optional?: boolean;
  included?: boolean;
}

export interface CostPreviewProps {
  /** Story generation cost */
  storyCost: number;
  /** Image generation cost per image */
  imageCost?: number;
  /** Number of images */
  imageCount?: number;
  /** Audio narration cost */
  audioCost?: number;
  /** Video generation cost */
  videoCost?: number;
  /** User's current credit balance */
  currentBalance: number;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when user acknowledges cost */
  onAcknowledge?: (acknowledged: boolean) => void;
}

export function CostPreview({
  storyCost,
  imageCost = 0,
  imageCount = 0,
  audioCost = 0,
  videoCost = 0,
  currentBalance,
  showBreakdown = true,
  className,
  onAcknowledge,
}: CostPreviewProps) {
  const [acknowledged, setAcknowledged] = React.useState(false);

  // Calculate totals
  const totalImageCost = imageCost * imageCount;
  const totalCost = storyCost + totalImageCost + audioCost + videoCost;
  const remainingBalance = currentBalance - totalCost;
  const hasEnoughCredits = remainingBalance >= 0;

  // Build cost items
  const costItems: CostItem[] = [
    {
      label: 'Story Generation',
      icon: <BookOpen className="h-4 w-4" />,
      cost: storyCost,
      description: 'AI-powered story creation',
      included: true,
    },
  ];

  if (imageCount > 0) {
    costItems.push({
      label: `Illustrations (${imageCount})`,
      icon: <Image className="h-4 w-4" />,
      cost: totalImageCost,
      description: `${imageCost} credits per image`,
      optional: true,
      included: true,
    });
  }

  if (audioCost > 0) {
    costItems.push({
      label: 'Audio Narration',
      icon: <Mic className="h-4 w-4" />,
      cost: audioCost,
      description: 'Professional voice narration',
      optional: true,
      included: true,
    });
  }

  if (videoCost > 0) {
    costItems.push({
      label: 'Video Generation',
      icon: <Video className="h-4 w-4" />,
      cost: videoCost,
      description: 'Animated story video',
      optional: true,
      included: true,
    });
  }

  const handleAcknowledge = (checked: boolean) => {
    setAcknowledged(checked);
    onAcknowledge?.(checked);
  };

  return (
    <Card
      variant="outlined"
      padding="md"
      className={cn('space-y-4', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Credit Cost Preview
        </h3>
      </div>

      {/* Cost Breakdown */}
      {showBreakdown && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {costItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center justify-between py-2 px-3 rounded-lg',
                  'bg-neutral-50 dark:bg-neutral-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary-500">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {item.label}
                      </span>
                      {item.optional && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          Optional
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <span className="text-xs text-neutral-500">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatCredits(item.cost)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Total */}
      <div
        className={cn(
          'flex items-center justify-between py-3 px-4 rounded-xl',
          'border-2',
          hasEnoughCredits
            ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950'
            : 'border-error-main/30 bg-error-light/10'
        )}
      >
        <div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Total Cost
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatCredits(totalCost)}
            </span>
            <span className="text-sm text-neutral-500">credits</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-500">After generation</span>
          <div
            className={cn(
              'text-lg font-semibold tabular-nums',
              hasEnoughCredits
                ? 'text-neutral-700 dark:text-neutral-300'
                : 'text-error-main'
            )}
          >
            {formatCredits(Math.max(0, remainingBalance))} remaining
          </div>
        </div>
      </div>

      {/* Warning if low on credits */}
      {!hasEnoughCredits && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            'bg-error-light/10 border border-error-main/20'
          )}
        >
          <AlertTriangle className="h-5 w-5 text-error-main shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-error-dark dark:text-error-light">
              Insufficient Credits
            </p>
            <p className="text-error-dark/70 dark:text-error-light/70">
              You need {formatCredits(Math.abs(remainingBalance))} more credits to
              generate this story.
            </p>
          </div>
        </motion.div>
      )}

      {/* Info tooltip */}
      {hasEnoughCredits && (
        <div
          className={cn(
            'flex items-start gap-2 text-xs text-neutral-500',
            'p-2 rounded bg-neutral-50 dark:bg-neutral-800/30'
          )}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Credits are deducted only after successful generation. If generation
            fails, no credits are charged.
          </p>
        </div>
      )}

      {/* Acknowledgment checkbox */}
      {onAcknowledge && hasEnoughCredits && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => handleAcknowledge(e.target.checked)}
            className={cn(
              'h-4 w-4 rounded border-neutral-300',
              'text-primary-500 focus:ring-primary-500'
            )}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            I understand and want to proceed with generation
          </span>
        </label>
      )}
    </Card>
  );
}

// Compact inline cost display
export function CostPreviewInline({
  totalCost,
  className,
}: {
  totalCost: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg',
        'bg-neutral-100 dark:bg-neutral-800',
        'text-sm font-medium text-neutral-700 dark:text-neutral-300',
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-primary-500" />
      <span className="tabular-nums">{formatCredits(totalCost)}</span>
      <span className="text-neutral-500">credits</span>
    </span>
  );
}
