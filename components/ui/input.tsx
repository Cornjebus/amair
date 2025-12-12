import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // NEW AMARI STYLE: Clean, warm, no heavy borders
          'flex h-12 w-full rounded-xl border border-amari-sand bg-white dark:bg-amari-surface px-4 py-3 text-sm font-body',
          'text-amari-charcoal dark:text-amari-cream',
          'placeholder:text-amari-muted',
          'transition-all duration-200',
          'focus:border-amari-terracotta focus:ring-2 focus:ring-amari-terracotta/20 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
