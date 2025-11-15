import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-white",
        secondary: "bg-[var(--accent)] text-white",
        destructive: "bg-[var(--error)] text-white",
        outline: "text-[var(--ink)] border border-[var(--border)] bg-transparent",
        success: "bg-[var(--success)] text-white",
        warning: "bg-[var(--warning)] text-white",
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
