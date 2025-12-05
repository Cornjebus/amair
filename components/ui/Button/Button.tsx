'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn, focusRing, disabledStyles } from '@/lib/design/utils';

// =============================================================================
// Button Component
// =============================================================================
// A versatile button component with multiple variants, sizes, and states

const buttonVariants = cva(
  // Base styles
  cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm',
    'rounded-xl',
    'transition-all duration-200 ease-out',
    'active:scale-[0.98]',
    focusRing
  ),
  {
    variants: {
      variant: {
        // Primary - Main actions
        primary: cn(
          'bg-primary-500 text-white',
          'hover:bg-primary-600',
          'shadow-md hover:shadow-lg',
          'hover:shadow-primary-500/25'
        ),
        // Secondary - Alternative actions
        secondary: cn(
          'bg-secondary-500 text-white',
          'hover:bg-secondary-600',
          'shadow-md hover:shadow-lg',
          'hover:shadow-secondary-500/25'
        ),
        // Outline - Bordered style
        outline: cn(
          'border-2 border-primary-500 text-primary-600',
          'hover:bg-primary-50',
          'dark:text-primary-400 dark:hover:bg-primary-950'
        ),
        // Ghost - Subtle style
        ghost: cn(
          'text-neutral-700 hover:bg-neutral-100',
          'dark:text-neutral-300 dark:hover:bg-neutral-800'
        ),
        // Danger - Destructive actions
        danger: cn(
          'bg-error-main text-white',
          'hover:bg-error-dark',
          'shadow-md hover:shadow-lg'
        ),
        // Success - Positive actions
        success: cn(
          'bg-success-main text-white',
          'hover:bg-success-dark',
          'shadow-md hover:shadow-lg'
        ),
        // Link - Text-only style
        link: cn(
          'text-primary-600 underline-offset-4',
          'hover:underline',
          'dark:text-primary-400'
        ),
        // Premium - Special gold style
        premium: cn(
          'bg-gradient-to-r from-accent-500 to-accent-600',
          'text-neutral-900 font-semibold',
          'hover:from-accent-400 hover:to-accent-500',
          'shadow-md hover:shadow-lg',
          'hover:shadow-accent-500/30'
        ),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          isDisabled && disabledStyles,
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
