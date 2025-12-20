import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Mobile-first: altura mínima 44px, font-size 16px (previne zoom iOS)
          "flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-brand/50 focus-visible:ring-[3px] focus-visible:border-brand focus-visible:shadow-lg focus-visible:shadow-brand/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive touch-manipulation",
          // Desktop: altura menor, font-size menor
          "sm:h-9 sm:text-sm sm:py-1",
          // Desktop: hover states
          "lg:hover:border-strong",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
