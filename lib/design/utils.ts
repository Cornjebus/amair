// =============================================================================
// Design System Utilities
// =============================================================================
// Helper functions for styling and component variants

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind merge support
 * Handles conditional classes and deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a delay for staggered animations
 */
export function staggerDelay(index: number, baseDelay = 50): string {
  return `${index * baseDelay}ms`;
}

/**
 * Format number with commas for display
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format credits with appropriate suffix
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return formatNumber(credits);
}

/**
 * Calculate contrast ratio between two colors
 * Returns true if the contrast is sufficient for accessibility
 */
export function hasGoodContrast(
  foreground: string,
  background: string,
  minRatio = 4.5
): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return ratio >= minRatio;
}

/**
 * Generate responsive classes based on breakpoint values
 */
export function responsive<T extends Record<string, string>>(
  values: Partial<{
    base: keyof T;
    sm: keyof T;
    md: keyof T;
    lg: keyof T;
    xl: keyof T;
    '2xl': keyof T;
  }>,
  classMap: T
): string {
  const classes: string[] = [];

  if (values.base) classes.push(classMap[values.base]);
  if (values.sm) classes.push(`sm:${classMap[values.sm]}`);
  if (values.md) classes.push(`md:${classMap[values.md]}`);
  if (values.lg) classes.push(`lg:${classMap[values.lg]}`);
  if (values.xl) classes.push(`xl:${classMap[values.xl]}`);
  if (values['2xl']) classes.push(`2xl:${classMap[values['2xl']]}`);

  return classes.join(' ');
}

/**
 * Focus ring styles for accessibility
 */
export const focusRing = cn(
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  'dark:focus-visible:ring-offset-neutral-900'
);

/**
 * Disabled state styles
 */
export const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

/**
 * Interactive element base styles
 */
export const interactiveBase = cn(
  'transition-all duration-200 ease-out',
  'select-none cursor-pointer',
  focusRing
);

/**
 * Skeleton loading animation class
 */
export const skeletonClass = cn(
  'animate-pulse bg-gradient-to-r',
  'from-neutral-200 via-neutral-100 to-neutral-200',
  'dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800',
  'bg-[length:200%_100%]'
);

/**
 * Glass morphism effect
 */
export const glassEffect = cn(
  'backdrop-blur-md bg-white/70',
  'dark:bg-neutral-900/70',
  'border border-white/20',
  'dark:border-neutral-800/50'
);

/**
 * Card elevation styles
 */
export const elevation = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg hover:shadow-xl transition-shadow',
  xl: 'shadow-xl hover:shadow-2xl transition-shadow',
} as const;

/**
 * Gradient text effect
 */
export function gradientText(from: string, to: string): string {
  return cn(
    'bg-gradient-to-r bg-clip-text text-transparent',
    `from-${from}`,
    `to-${to}`
  );
}

/**
 * Screen reader only class
 */
export const srOnly = cn(
  'absolute w-[1px] h-[1px] p-0 -m-[1px]',
  'overflow-hidden whitespace-nowrap',
  'border-0 clip-[rect(0,0,0,0)]'
);

/**
 * Visually hidden but focusable (for skip links)
 */
export const visuallyHiddenFocusable = cn(
  srOnly,
  'focus:absolute focus:w-auto focus:h-auto',
  'focus:m-0 focus:overflow-visible focus:clip-auto',
  'focus:whitespace-normal'
);
