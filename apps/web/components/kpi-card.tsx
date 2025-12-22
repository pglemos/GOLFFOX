"use client"

import React from "react"
import { motion } from "framer-motion"
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  trend?: number
  trendLabel?: string
  loading?: boolean
  className?: string
  onClick?: () => void
}

function KpiCardComponent({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  trendLabel,
  loading = false,
  className,
  onClick
}: KpiCardProps) {

  if (loading) {
    return (
      <Card variant="premium" className={cn("p-6 h-full flex flex-col justify-between", className)}>
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-muted animate-pulse w-12 h-12" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </Card>
    )
  }

  const isPositive = trend !== undefined && trend > 0
  const isNegative = trend !== undefined && trend < 0
  const isNeutral = trend !== undefined && trend === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02, y: -4 } : undefined}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card variant="premium" className={cn("p-6 h-full relative overflow-hidden group", className)}>
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-brand/10" />

        <div className="relative flex flex-col h-full justify-between">
          <div className="flex items-start justify-between mb-4">
            {/* Icon Box */}
            <div className="p-3 rounded-xl bg-brand-light border border-brand/10 group-hover:border-brand/30 transition-colors duration-300">
              <Icon className="w-6 h-6 text-brand" />
            </div>

            {/* Trend Badge */}
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border",
                isPositive && "bg-success-light text-success border-success/20",
                isNegative && "bg-error-light text-error border-error/20",
                isNeutral && "bg-muted text-muted-foreground border-border"
              )}>
                {isPositive && <ArrowUpRight className="w-3 h-3" />}
                {isNegative && <ArrowDownRight className="w-3 h-3" />}
                {isNeutral && <Minus className="w-3 h-3" />}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-ink-muted mb-1">{label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-ink-strong tracking-tight">
                {value}
              </span>
            </div>
            {(hint || trendLabel) && (
              <p className="text-xs text-ink-light mt-2 flex items-center gap-1">
                {hint || trendLabel}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export const KpiCard = React.memo(KpiCardComponent, (prev, next) => 
  prev.value === next.value &&
  prev.trend === next.trend &&
  prev.label === next.label &&
  prev.onClick === next.onClick
)
