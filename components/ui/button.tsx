import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white hover:from-lavender-600 hover:to-lavender-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
        secondary: 'bg-gradient-to-r from-skyblue-500 to-skyblue-600 text-white hover:from-skyblue-600 hover:to-skyblue-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
        outline: 'border-2 border-lavender-400 bg-white/50 hover:bg-lavender-50 text-lavender-700',
        ghost: 'hover:bg-lavender-100 text-lavender-700',
        link: 'text-lavender-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4',
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
