'use client';

import * as React from 'react';
import { usePrefersReducedMotion } from '@/lib/accessibility';

// =============================================================================
// Reduced Motion Wrapper
// =============================================================================
// Respects user's reduced motion preference

export interface ReducedMotionProps {
  children: React.ReactNode;
  /** Content to show when reduced motion is preferred */
  fallback?: React.ReactNode;
  /** Force reduced motion regardless of user preference */
  forceReduced?: boolean;
}

export function ReducedMotion({
  children,
  fallback,
  forceReduced = false,
}: ReducedMotionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldReduce = forceReduced || prefersReducedMotion;

  if (shouldReduce && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// =============================================================================
// Animation Config Hook
// =============================================================================
// Returns animation configuration based on user preferences

export interface AnimationConfig {
  /** Whether to show animations */
  animate: boolean;
  /** Animation duration in seconds */
  duration: number;
  /** CSS transition duration */
  transitionDuration: string;
  /** Framer Motion transition config */
  transition: {
    duration: number;
    ease: string;
  };
  /** Framer Motion spring config */
  spring: {
    type: 'spring' | 'tween';
    stiffness?: number;
    damping?: number;
    duration?: number;
  };
}

export function useAnimationConfig(): AnimationConfig {
  const prefersReducedMotion = usePrefersReducedMotion();

  return React.useMemo(() => {
    if (prefersReducedMotion) {
      return {
        animate: false,
        duration: 0,
        transitionDuration: '0ms',
        transition: {
          duration: 0,
          ease: 'linear',
        },
        spring: {
          type: 'tween' as const,
          duration: 0,
        },
      };
    }

    return {
      animate: true,
      duration: 0.3,
      transitionDuration: '300ms',
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
      spring: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    };
  }, [prefersReducedMotion]);
}

// =============================================================================
// CSS Variables for Reduced Motion
// =============================================================================
// Injects CSS custom properties for reduced motion

export function ReducedMotionStyles() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --animation-duration: ${prefersReducedMotion ? '0ms' : '300ms'};
            --transition-duration: ${prefersReducedMotion ? '0ms' : '200ms'};
            --animation-play-state: ${prefersReducedMotion ? 'paused' : 'running'};
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `,
      }}
    />
  );
}
