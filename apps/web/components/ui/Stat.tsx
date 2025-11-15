"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatProps {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
  trend?: number
  trendLabel?: string
  className?: string
}

const Stat = ({ icon: Icon, label, value, hint, trend, trendLabel, className }: StatProps) => {
  const count = typeof value === 'number' ? value : parseInt(value) || 0
  const displayValue = typeof value === 'number' ? value : value
  
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 300 })
  const display = useTransform(springValue, (latest) => Math.round(latest))
  
  React.useEffect(() => {
    if (typeof value === 'number') {
      motionValue.set(count)
    }
  }, [count, motionValue, value])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn("stat-card group cursor-pointer", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon Container */}
          <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--brand-light)] group-hover:bg-[var(--brand)] transition-colors duration-200">
            <Icon className="w-6 h-6 text-[var(--brand)] group-hover:text-white transition-colors duration-200" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--ink-muted)] mb-2">
              {label}
            </p>
            <motion.p className="text-3xl font-bold tabular-nums text-[var(--ink-strong)] truncate">
              {typeof value === 'number' ? display : displayValue}
            </motion.p>
            {hint && (
              <p className="text-xs text-[var(--ink-muted)] mt-1.5">
                {hint}
              </p>
            )}
          </div>
        </div>
        
        {/* Trend Badge */}
        {trend !== undefined && (
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0",
            trend >= 0 
              ? "bg-[var(--success-light)] text-[var(--success)]" 
              : "bg-[var(--error-light)] text-[var(--error)]"
          )}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            {trendLabel && <span className="ml-1 text-[var(--ink-muted)]">vs {trendLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { Stat }

