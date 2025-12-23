import * as React from "react"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/15 hover:border-white/30 hover:shadow-lg transition-all duration-300",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-white/10 bg-white/5 backdrop-blur-md text-foreground shadow-xs hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-white/5 hover:text-accent-foreground dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 rounded-xl",
      },
      size: {
        default: "min-h-[48px] px-4 py-3 has-[>svg]:px-3",
        sm: "min-h-[44px] rounded-md gap-1.5 px-3 py-2 has-[>svg]:px-2.5",
        lg: "min-h-[52px] rounded-md px-6 py-3 has-[>svg]:px-4",
        icon: "size-9 min-h-[48px]",
        "icon-sm": "size-8 min-h-[44px]",
        "icon-lg": "size-10 min-h-[52px]",
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
    />
  )
}

export { Button, buttonVariants }
