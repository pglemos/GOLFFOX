import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  // Base styles - Mobile-first: altura mínima 48px, font-size 16px (previne zoom iOS)
  "flex min-h-[48px] w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 text-base shadow-xs transition-all duration-300 placeholder:text-muted-foreground touch-manipulation hover:bg-white/10 hover:border-white/20 focus:bg-white/10",
  {
    variants: {
      focus: {
        default:
          "focus-visible:outline-none focus-visible:ring-brand/50 focus-visible:ring-[3px] focus-visible:border-brand focus-visible:shadow-lg focus-visible:shadow-brand/10",
      },
      state: {
        default: "",
        disabled: "disabled:cursor-not-allowed disabled:opacity-50",
        invalid:
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      },
      size: {
        mobile: "", // Mobile-first (default)
        desktop: "sm:h-9 sm:text-sm sm:py-1",
      },
      hover: {
        default: "",
        enabled: "lg:hover:border-strong",
      },
    },
    defaultVariants: {
      focus: "default",
      state: "default",
      size: "mobile",
      hover: "enabled",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, focus, state, size, hover, ...props }, ref) => {
    // Auto-detect state based on props
    const inputState = props.disabled
      ? "disabled"
      : props["aria-invalid"]
        ? "invalid"
        : state

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ focus, state: inputState, size, hover }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
