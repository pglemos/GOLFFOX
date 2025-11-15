"use client"

import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  trend?: number
  className?: string
}

export function KpiCard({ icon: Icon, label, value, hint, trend, className }: KpiCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group cursor-pointer"
    >
      <div className={cn(
        "kpi-card relative overflow-hidden",
        "hover:border-[var(--brand)]/30",
        className
      )}>
        {/* Background gradient sutil no hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/0 via-[var(--brand)]/0 to-[var(--brand)]/0 group-hover:from-[var(--brand)]/5 group-hover:via-[var(--brand)]/5 group-hover:to-[var(--brand)]/5 transition-all duration-300" />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 flex-1">
              {/* Icon Container */}
              <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--brand-light)] group-hover:bg-[var(--brand)] transition-colors duration-200">
                <Icon className="w-5 h-5 text-[var(--brand)] group-hover:text-white transition-colors duration-200" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--ink-muted)] mb-2 font-medium">
                  {label}
                </p>
                <p className="text-3xl font-bold tabular-nums text-[var(--ink-strong)] truncate">
                  {value}
                </p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
