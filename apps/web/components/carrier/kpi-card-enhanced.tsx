"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardEnhancedProps {
  icon: LucideIcon
  label: string
  value: number
  previousValue?: number
  hint?: string
  formatValue?: (value: number) => string
  iconColor?: string
  iconBgColor?: string
  className?: string
  onClick?: () => void
}

export function KpiCardEnhanced({
  icon: Icon,
  label,
  value,
  previousValue,
  hint,
  formatValue = (v) => v.toString(),
  iconColor = "var(--brand)",
  iconBgColor = "var(--brand-light)",
  className,
  onClick
}: KpiCardEnhancedProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const spring = useSpring(0, { stiffness: 50, damping: 30 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })
    return () => unsubscribe()
  }, [display])

  const trend = previousValue !== undefined
    ? previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : value > 0 ? 100 : 0
    : undefined

  const TrendIcon = trend !== undefined
    ? trend > 0 ? TrendingUp
    : trend < 0 ? TrendingDown
    : Minus
    : null

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group cursor-pointer", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon Container */}
              <div
                className="p-2.5 sm:p-3 rounded-lg flex-shrink-0 transition-colors duration-200"
                style={{ backgroundColor: iconBgColor }}
              >
                <Icon
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200"
                  style={{ color: iconColor }}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] mb-1.5 font-medium truncate">
                  {label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--ink-strong)] truncate">
                  {formatValue(displayValue)}
                </p>
                {hint && (
                  <p className="text-xs text-[var(--ink-muted)] mt-1 truncate">
                    {hint}
                  </p>
                )}
              </div>
            </div>
            
            {/* Trend Badge */}
            {trend !== undefined && TrendIcon && (
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0",
                  trend > 0
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : trend < 0
                    ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                )}
              >
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Comparison text */}
          {previousValue !== undefined && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--ink-muted)]">
                {trend !== undefined && trend > 0 && "↑ "}
                {trend !== undefined && trend < 0 && "↓ "}
                {trend !== undefined && trend === 0 && "→ "}
                Período anterior: {formatValue(previousValue)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

