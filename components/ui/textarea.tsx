import * as React from "react"

import { cn } from "@/lib/design/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border-2 border-amari-sand bg-white px-3 py-2 text-sm",
          "placeholder:text-amari-muted",
          "focus:outline-none focus:ring-2 focus:ring-amari-sage/50 focus:border-amari-sage",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
