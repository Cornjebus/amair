'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Progress from '@radix-ui/react-progress';
import {
  Sparkles,
  BookOpen,
  Image,
  Mic,
  Video,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/design/utils';
import { Card } from '@/components/ui/Card/Card';

// =============================================================================
// GenerationProgress Component
// =============================================================================
// Multi-stage progress indicator for story generation

export type GenerationStage =
  | 'preparing'
  | 'story'
  | 'images'
  | 'audio'
  | 'video'
  | 'complete'
  | 'error';

interface StageConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  estimatedTime?: string;
}

const stageConfigs: Record<GenerationStage, StageConfig> = {
  preparing: {
    label: 'Preparing',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Setting up your magical story...',
    estimatedTime: '~5 seconds',
  },
  story: {
    label: 'Writing Story',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Crafting your personalized adventure...',
    estimatedTime: '~15-30 seconds',
  },
  images: {
    label: 'Creating Illustrations',
    icon: <Image className="h-5 w-5" />,
    description: 'Painting beautiful scenes...',
    estimatedTime: '~30-60 seconds per image',
  },
  audio: {
    label: 'Recording Narration',
    icon: <Mic className="h-5 w-5" />,
    description: 'Adding voice to your story...',
    estimatedTime: '~20-40 seconds',
  },
  video: {
    label: 'Generating Video',
    icon: <Video className="h-5 w-5" />,
    description: 'Bringing your story to life...',
    estimatedTime: '~2-5 minutes',
  },
  complete: {
    label: 'Complete',
    icon: <Check className="h-5 w-5" />,
    description: 'Your story is ready!',
  },
  error: {
    label: 'Error',
    icon: <AlertCircle className="h-5 w-5" />,
    description: 'Something went wrong',
  },
};

export interface GenerationProgressProps {
  /** Current stage of generation */
  stage: GenerationStage;
  /** Progress within current stage (0-100) */
  progress?: number;
  /** All stages to show */
  stages: GenerationStage[];
  /** Error message if stage is 'error' */
  errorMessage?: string;
  /** Callback to retry on error */
  onRetry?: () => void;
  /** Custom class name */
  className?: string;
  /** Time elapsed in seconds */
  elapsedTime?: number;
  /** Additional status message */
  statusMessage?: string;
}

export function GenerationProgress({
  stage,
  progress = 0,
  stages,
  errorMessage,
  onRetry,
  className,
  elapsedTime,
  statusMessage,
}: GenerationProgressProps) {
  const currentStageIndex = stages.indexOf(stage);
  const overallProgress =
    stage === 'complete'
      ? 100
      : stage === 'error'
        ? 0
        : ((currentStageIndex + progress / 100) / stages.length) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              rotate: stage !== 'complete' && stage !== 'error' ? 360 : 0,
            }}
            transition={{
              repeat: stage !== 'complete' && stage !== 'error' ? Infinity : 0,
              duration: 2,
              ease: 'linear',
            }}
            className={cn(
              'p-2 rounded-xl',
              stage === 'error'
                ? 'bg-error-light/20 text-error-main'
                : stage === 'complete'
                  ? 'bg-success-light/20 text-success-main'
                  : 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
            )}
          >
            {stageConfigs[stage].icon}
          </motion.div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {stageConfigs[stage].label}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {statusMessage || stageConfigs[stage].description}
            </p>
          </div>
        </div>

        {elapsedTime !== undefined && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedTime)}
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress.Root
          value={overallProgress}
          className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
        >
          <Progress.Indicator
            className={cn(
              'h-full transition-all duration-500 ease-out',
              stage === 'error'
                ? 'bg-error-main'
                : stage === 'complete'
                  ? 'bg-success-main'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500'
            )}
            style={{ width: `${overallProgress}%` }}
          />
        </Progress.Root>
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between">
        {stages.map((s, index) => {
          const isComplete = index < currentStageIndex || stage === 'complete';
          const isCurrent = s === stage && stage !== 'complete';
          const isPending = index > currentStageIndex;
          const hasError = stage === 'error' && s === stage;

          return (
            <div
              key={s}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-colors duration-300',
                  hasError && 'bg-error-light/20 text-error-main',
                  isComplete && 'bg-success-light/20 text-success-main',
                  isCurrent &&
                    !hasError &&
                    'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400 ring-2 ring-primary-500 ring-offset-2',
                  isPending && 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : isCurrent && !hasError ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stageConfigs[s].icon
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium',
                  (isComplete || isCurrent) && !hasError
                    ? 'text-neutral-700 dark:text-neutral-300'
                    : 'text-neutral-400'
                )}
              >
                {stageConfigs[s].label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Progress */}
      {stage !== 'complete' && stage !== 'error' && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{stageConfigs[stage].label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress.Root
            value={progress}
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
          >
            <Progress.Indicator
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </Progress.Root>
        </div>
      )}

      {/* Estimated Time */}
      {stage !== 'complete' && stage !== 'error' && stageConfigs[stage].estimatedTime && (
        <p className="text-xs text-center text-neutral-500">
          Estimated time: {stageConfigs[stage].estimatedTime}
        </p>
      )}

      {/* Error State */}
      <AnimatePresence>
        {stage === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'p-4 rounded-xl',
              'bg-error-light/10 border border-error-main/20'
            )}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-error-main shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-error-dark dark:text-error-light">
                  Generation Failed
                </p>
                <p className="text-sm text-error-dark/70 dark:text-error-light/70 mt-1">
                  {errorMessage || 'An unexpected error occurred. Please try again.'}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={cn(
                      'mt-3 px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-error-main text-white',
                      'hover:bg-error-dark transition-colors'
                    )}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      <AnimatePresence>
        {stage === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'p-4 rounded-xl text-center',
              'bg-success-light/10 border border-success-main/20'
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="inline-flex p-3 rounded-full bg-success-light/20 text-success-main mb-3"
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h4 className="font-semibold text-success-dark dark:text-success-light">
              Your Story is Ready!
            </h4>
            <p className="text-sm text-success-dark/70 dark:text-success-light/70 mt-1">
              Time to start the adventure
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
