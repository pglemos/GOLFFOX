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
  const display = useTransform(springValue, (latest: number) => Math.round(latest))

  React.useEffect(() => {
    if (typeof value === 'number') {
      motionValue.set(count)
    }
  }, [count, motionValue, value])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }}
      className={cn("stat-card group cursor-pointer touch-manipulation", className)}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Icon Container - Ultra Premium */}
          <div className="relative flex-shrink-0 py-1">
            <motion.div 
              className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] group-hover:from-[var(--brand)] group-hover:to-[var(--brand-hover)] transition-all duration-300 relative shadow-md group-hover:shadow-[var(--shadow-brand)]"
              whileHover={{ 
                rotate: [0, -8, 8, 0],
                scale: 1.15
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.4 }}
              />
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--brand)] group-hover:text-white transition-all duration-300 relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }} />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-[var(--brand)] opacity-0 group-hover:opacity-20 blur-xl"
              style={{ top: '-4px', right: '-4px', bottom: '-4px', left: '-4px', zIndex: -1 }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-visible">
            <p className="text-sm sm:text-sm font-medium text-[var(--ink-muted)] mb-1.5 sm:mb-2">
              {label}
            </p>
            <motion.p 
              className="text-3xl sm:text-3xl lg:text-4xl font-bold tabular-nums text-[var(--ink-strong)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {typeof value === 'number' ? display : displayValue}
            </motion.p>
            {hint && (
              <p className="text-xs sm:text-xs text-[var(--ink-muted)] mt-1.5 sm:mt-2">
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
            <span className="hidden sm:inline">{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
            <span className="sm:hidden">{trend >= 0 ? '↑' : '↓'}</span>
            {trendLabel && <span className="ml-1 text-[var(--ink-muted)] hidden sm:inline">vs {trendLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { Stat }

