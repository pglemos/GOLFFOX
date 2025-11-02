import * as React from "react"
import { cn } from "@/lib/utils"

interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  glass?: boolean
  gradient?: boolean
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ className, title, description, glass = false, gradient = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden p-12",
          glass ? "hero-glass" : "bg-gradient-to-br from-[var(--accent)] via-[var(--accent-soft)] to-[var(--brand)]",
          className
        )}
        {...props}
      >
        {glass && (
          <>
            <div className="absolute inset-0 hero-glass::before opacity-90" />
            <div className="absolute inset-0 gradient-overlay" />
          </>
        )}
        {gradient && !glass && (
          <div className="absolute inset-0 gradient-overlay" />
        )}
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    )
  }
)
Hero.displayName = "Hero"

export { Hero }

