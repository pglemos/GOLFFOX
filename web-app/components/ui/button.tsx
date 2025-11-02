import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-lg)] text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-opacity-20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] shadow-md hover:shadow-lg",
        destructive: "bg-[var(--error)] text-white hover:bg-[var(--error)]/90 shadow-md hover:shadow-lg",
        outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--bg-hover)] hover:border-[var(--brand)]",
        secondary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-soft)]",
        ghost: "hover:bg-[var(--bg-hover)]",
        link: "text-[var(--brand)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }
    
    const { whileHover, whileTap, transition, ...restProps } = props as any
    
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={whileHover || { scale: 1.02 }}
        whileTap={whileTap || { scale: 0.98 }}
        transition={transition || { duration: 0.15 }}
        {...(restProps as any)}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
