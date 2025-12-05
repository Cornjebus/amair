'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/design/utils';

// =============================================================================
// Card Component
// =============================================================================
// A flexible card component for containing content with various styles

const cardVariants = cva(
  // Base styles
  'rounded-2xl transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Clean white card
        default: cn(
          'bg-white border border-neutral-200',
          'dark:bg-neutral-900 dark:border-neutral-800'
        ),
        // Elevated - With shadow
        elevated: cn(
          'bg-white shadow-lg',
          'dark:bg-neutral-900',
          'hover:shadow-xl'
        ),
        // Outlined - Border emphasis
        outlined: cn(
          'border-2 border-neutral-200 bg-transparent',
          'dark:border-neutral-700'
        ),
        // Filled - Subtle background
        filled: cn(
          'bg-neutral-50 border border-neutral-100',
          'dark:bg-neutral-800 dark:border-neutral-700'
        ),
        // Glass - Frosted glass effect
        glass: cn(
          'backdrop-blur-md bg-white/70 border border-white/20',
          'dark:bg-neutral-900/70 dark:border-neutral-800/50'
        ),
        // Gradient - Magical gradient
        gradient: cn(
          'bg-gradient-to-br from-primary-50 to-secondary-50',
          'border border-primary-100',
          'dark:from-primary-950 dark:to-secondary-950',
          'dark:border-primary-900'
        ),
        // Interactive - Hover effects
        interactive: cn(
          'bg-white border border-neutral-200',
          'dark:bg-neutral-900 dark:border-neutral-800',
          'hover:border-primary-300 hover:shadow-lg',
          'dark:hover:border-primary-700',
          'cursor-pointer'
        ),
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Element to render as */
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight',
      'text-neutral-900 dark:text-neutral-50',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-600 dark:text-neutral-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
