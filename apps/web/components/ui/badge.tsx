"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-white shadow-[var(--shadow-brand)] hover:shadow-[var(--shadow-brand-lg)]",
        secondary: "bg-[var(--accent)] text-white shadow-md hover:shadow-lg",
        destructive: "bg-[var(--error)] text-white shadow-md hover:shadow-lg",
        outline: "text-[var(--ink)] border-2 border-[var(--border)] bg-transparent hover:bg-[var(--bg-hover)] hover:border-[var(--brand)]",
        success: "bg-[var(--success)] text-white shadow-md hover:shadow-lg",
        warning: "bg-[var(--warning)] text-white shadow-md hover:shadow-lg",
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
    <motion.div 
      className={cn(badgeVariants({ variant }), className)} 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      {...props}
    >
      {props.children}
      {variant === "default" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  )
}

export { Badge, badgeVariants }
