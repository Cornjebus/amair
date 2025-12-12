import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amari-terracotta focus:ring-offset-2",
  {
    variants: {
      variant: {
        // NEW AMARI STYLES
        default:
          "border-transparent bg-amari-terracotta text-white",
        secondary:
          "border-transparent bg-amari-sage text-white",
        outline:
          "border-amari-sand text-amari-charcoal dark:text-amari-cream",
        destructive:
          "border-transparent bg-red-500 text-white",
        success:
          "border-transparent bg-amari-sage text-white",
        muted:
          "border-transparent bg-amari-sand text-amari-charcoal dark:bg-amari-surface dark:text-amari-cream",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
