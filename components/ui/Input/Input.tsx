'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, Check, Eye, EyeOff, Search, X } from 'lucide-react';
import { cn, focusRing } from '@/lib/design/utils';
import { useAccessibleField } from '@/lib/accessibility';

// =============================================================================
// Input Component
// =============================================================================
// Accessible input field with variants, icons, and validation states

const inputVariants = cva(
  // Base styles
  cn(
    'w-full rounded-xl border',
    'bg-white dark:bg-neutral-900',
    'text-neutral-900 dark:text-neutral-100',
    'placeholder:text-neutral-400',
    'transition-all duration-200',
    focusRing
  ),
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      variant: {
        default: cn(
          'border-neutral-200 dark:border-neutral-700',
          'hover:border-neutral-300 dark:hover:border-neutral-600'
        ),
        filled: cn(
          'bg-neutral-100 dark:bg-neutral-800',
          'border-transparent',
          'hover:bg-neutral-200 dark:hover:bg-neutral-700'
        ),
        underline: cn(
          'rounded-none border-0 border-b-2 px-0',
          'border-neutral-200 dark:border-neutral-700',
          'hover:border-neutral-400 dark:hover:border-neutral-500',
          'focus:border-primary-500'
        ),
      },
      state: {
        default: '',
        error: cn(
          'border-error-main',
          'focus-visible:ring-error-main/50',
          'hover:border-error-main'
        ),
        success: cn(
          'border-success-main',
          'focus-visible:ring-success-main/50',
          'hover:border-success-main'
        ),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label for the input */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Left icon or element */
  leftElement?: React.ReactNode;
  /** Right icon or element */
  rightElement?: React.ReactNode;
  /** Show clear button */
  clearable?: boolean;
  /** Callback when cleared */
  onClear?: () => void;
  /** Container class name */
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      size,
      variant,
      state: stateProp,
      label,
      helperText,
      error,
      success,
      leftElement,
      rightElement,
      clearable,
      onClear,
      type = 'text',
      required,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Determine state
    const state = stateProp || (error ? 'error' : success ? 'success' : 'default');

    // Get accessible field props
    const { fieldProps, labelProps, errorProps, descriptionProps } =
      useAccessibleField({
        name: props.name || 'input',
        error,
        description: helperText,
        required,
      });

    // Check if there's a value for clearable
    const hasValue = value !== undefined && value !== '';

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            {...labelProps}
            className={cn(
              'block text-sm font-medium',
              'text-neutral-700 dark:text-neutral-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && (
              <span className="text-error-main ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Element */}
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftElement}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            className={cn(
              inputVariants({ size, variant, state }),
              leftElement && 'pl-10',
              (rightElement || isPassword || (clearable && hasValue)) && 'pr-10',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...fieldProps}
            {...props}
          />

          {/* Right Elements Container */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* State Indicator */}
            {state === 'error' && !rightElement && (
              <AlertCircle className="h-4 w-4 text-error-main" aria-hidden="true" />
            )}
            {state === 'success' && !rightElement && (
              <Check className="h-4 w-4 text-success-main" aria-hidden="true" />
            )}

            {/* Clear Button */}
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  'p-1 rounded-md',
                  'text-neutral-400 hover:text-neutral-600',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'transition-colors',
                  focusRing
                )}
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'p-1 rounded-md',
                  'text-neutral-400 hover:text-neutral-600',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'transition-colors',
                  focusRing
                )}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Custom Right Element */}
            {rightElement && (
              <span className="text-neutral-400">{rightElement}</span>
            )}
          </div>
        </div>

        {/* Helper Text / Error / Success */}
        {(helperText || error || success) && (
          <div
            {...(error ? errorProps : descriptionProps)}
            className={cn(
              'text-xs',
              error && 'text-error-main',
              success && 'text-success-main',
              !error && !success && 'text-neutral-500'
            )}
          >
            {error || success || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input Variant
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'leftElement' | 'type'>
>((props, ref) => (
  <Input
    ref={ref}
    type="search"
    leftElement={<Search className="h-4 w-4" />}
    clearable
    {...props}
  />
));

SearchInput.displayName = 'SearchInput';

export { Input, inputVariants };
