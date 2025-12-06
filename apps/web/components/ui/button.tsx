import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-lg)] text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-opacity-20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] text-white hover:from-[var(--brand-hover)] hover:to-[var(--brand)] shadow-[var(--shadow-brand)] hover:shadow-[var(--shadow-brand-lg)] active:shadow-[var(--shadow-md)] hover:scale-105",
        destructive: "bg-gradient-to-r from-[var(--error)] to-[#DC2626] text-white hover:from-[#DC2626] hover:to-[var(--error)] shadow-md hover:shadow-lg active:shadow-sm hover:scale-105",
        outline: "border-2 border-[var(--border)] bg-transparent hover:bg-gradient-to-r hover:from-[var(--bg-hover)] hover:to-[var(--bg-soft)] hover:border-[var(--brand)] hover:text-[var(--brand)] active:bg-[var(--bg-soft)] hover:scale-105 backdrop-blur-sm",
        secondary: "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] text-white hover:from-[var(--accent-soft)] hover:to-[var(--accent)] shadow-md hover:shadow-lg active:shadow-sm hover:scale-105",
        ghost: "hover:bg-gradient-to-r hover:from-[var(--bg-hover)] hover:to-[var(--bg-soft)] active:bg-[var(--bg-soft)] hover:scale-105",
        link: "text-[var(--brand)] underline-offset-4 hover:underline hover:text-[var(--brand-hover)] hover:scale-105",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11",
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
        whileHover={whileHover || { 
          scale: 1.02,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={whileTap || { 
          scale: 0.97,
          transition: { duration: 0.1 }
        }}
        transition={transition || { 
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
        {...(restProps as any)}
      >
        <span className="relative z-10">{props.children}</span>
        {variant === "default" && (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </>
        )}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
