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
          "relative overflow-hidden p-8 md:p-12 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-w-[1200px] mx-auto",
          glass ? "hero-glass" : "bg-gradient-to-br from-accent-custom via-accent-custom-soft to-brand",
          className
        )}
        {...props}
      >
        {glass && (
          <>
            {/* overlay glass é feito via CSS ::before; mantemos apenas o gradient extra */}
            <div className="absolute inset-0 gradient-overlay" aria-hidden="true" role="presentation" />
          </>
        )}
        {gradient && !glass && (
          <div className="absolute inset-0 gradient-overlay" aria-hidden="true" role="presentation" />
        )}
        
        <div className="relative z-10 space-y-4 md:space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-lg md:text-xl font-normal leading-relaxed text-white/90 max-w-2xl">
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

