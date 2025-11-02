"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface FilterBarProps {
  className?: string
  children: React.ReactNode
  onClear?: () => void
  activeCount?: number
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, children, onClear, activeCount = 0, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(true)

    return (
      <div ref={ref} className={cn("filter-bar", className)} {...props}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="h-5 w-5 text-[var(--ink-muted)]" />
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand)] text-white text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {children}
        </div>
        
        {onClear && activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    )
  }
)
FilterBar.displayName = "FilterBar"

export { FilterBar }

