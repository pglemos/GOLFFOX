import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base sm:text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:bg-primary/90 lg:hover:bg-primary/90 lg:hover:shadow-lg lg:hover:shadow-primary/20",
        destructive:
          "bg-destructive text-white active:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 lg:hover:bg-destructive/90 lg:hover:shadow-lg lg:hover:shadow-destructive/20",
        outline:
          "border bg-background shadow-xs active:bg-accent active:text-accent-foreground dark:bg-input/30 dark:border-input dark:active:bg-input/50 lg:hover:bg-accent lg:hover:text-accent-foreground lg:hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground active:bg-secondary/80 lg:hover:bg-secondary/80 lg:hover:shadow-md",
        ghost:
          "active:bg-accent active:text-accent-foreground dark:active:bg-accent/50 lg:hover:bg-accent lg:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 lg:hover:underline",
        gradient: "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] text-white active:from-[var(--brand-hover)] active:to-[var(--brand)] lg:hover:from-[var(--brand-hover)] lg:hover:to-[var(--brand)] lg:hover:shadow-xl lg:hover:shadow-[var(--brand)]/30",
        shimmer: "bg-gradient-to-r from-[var(--brand)] via-[var(--brand-hover)] to-[var(--brand)] text-white bg-[length:200%_100%] active:bg-[position:100%_0] lg:hover:bg-[position:100%_0] lg:hover:shadow-xl lg:hover:shadow-[var(--brand)]/30",
      },
      size: {
        default: "min-h-[44px] px-4 py-2 has-[>svg]:px-3 sm:h-9 sm:min-h-0",
        sm: "min-h-[44px] rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 sm:h-8 sm:min-h-0",
        lg: "min-h-[44px] rounded-md px-6 has-[>svg]:px-4 sm:h-10 sm:min-h-0",
        icon: "min-h-[44px] min-w-[44px] sm:size-9 sm:min-h-0 sm:min-w-0",
        "icon-sm": "min-h-[40px] min-w-[40px] sm:size-8 sm:min-h-0 sm:min-w-0",
        "icon-lg": "min-h-[48px] min-w-[48px] sm:size-10 sm:min-h-0 sm:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {variant === "shimmer" && (
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
