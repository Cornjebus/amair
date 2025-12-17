'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverScale = 1.02, hoverY = -4, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl border border-amari-sand bg-white transition-shadow',
          className
        )}
        whileHover={{
          scale: hoverScale,
          y: hoverY,
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Story card with image placeholder and hover effects
interface StoryCardProps {
  title: string;
  description: string;
  date: string;
  tone: string;
  wordCount: number;
  isFavorite?: boolean;
  href: string;
  preview?: string;
}

const toneEmoji: Record<string, string> = {
  'bedtime-calm': '🌙',
  funny: '😄',
  adventure: '🗺️',
  mystery: '🔍',
};

export function AnimatedStoryCard({
  title,
  description,
  date,
  tone,
  wordCount,
  isFavorite,
  href,
  preview,
}: StoryCardProps) {
  return (
    <motion.a
      href={href}
      className="block"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="rounded-xl border border-amari-sand bg-white overflow-hidden hover:shadow-xl transition-shadow h-full">
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <motion.span
              className="text-3xl"
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {toneEmoji[tone] || '📖'}
            </motion.span>
            <div className="text-right">
              <div className="text-xs text-amari-muted">{date}</div>
              {isFavorite && (
                <motion.span
                  className="text-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  ❤️
                </motion.span>
              )}
            </div>
          </div>
          <h3 className="text-xl font-display font-semibold text-amari-charcoal line-clamp-2 mb-2">
            {title}
          </h3>
          <p className="text-sm text-amari-muted">
            {wordCount} words • {Math.ceil(wordCount / 150)} min read
          </p>
          {preview && (
            <p className="pt-3 text-sm text-amari-muted line-clamp-3">{preview}...</p>
          )}
        </div>
      </div>
    </motion.a>
  );
}

// Quick action card with icon and hover animation
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  iconColor?: string;
}

export function QuickActionCard({
  title,
  description,
  icon,
  href,
  iconColor = 'text-amari-terracotta',
}: QuickActionCardProps) {
  return (
    <motion.a
      href={href}
      className="block"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="rounded-xl border border-amari-sand bg-white p-6 hover:shadow-lg transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          <motion.div
            className={cn('p-3 rounded-xl bg-amari-sand/30', iconColor)}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <div>
            <h3 className="text-lg font-display font-semibold text-amari-charcoal group-hover:text-amari-terracotta transition-colors">
              {title}
            </h3>
            <p className="text-sm text-amari-muted">{description}</p>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
