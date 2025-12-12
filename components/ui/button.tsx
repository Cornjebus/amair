import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amari-terracotta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // NEW AMARI STYLES (Cozy Modern)
        default: 'bg-amari-terracotta text-white hover:bg-[#C96A4F] active:bg-[#B85A3F]',
        secondary: 'bg-amari-sage text-white hover:bg-[#6FA088] active:bg-[#5E8A75]',
        outline: 'border border-amari-sand bg-transparent text-amari-charcoal hover:bg-amari-sand/50 dark:text-amari-cream dark:hover:bg-amari-sand/20',
        ghost: 'text-amari-charcoal hover:bg-amari-sand/30 dark:text-amari-cream',
        link: 'text-amari-terracotta underline-offset-4 hover:underline',
        // Destructive
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
