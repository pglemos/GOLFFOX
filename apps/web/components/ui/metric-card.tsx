"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedNumber } from "./animated-number"
import { StatusIndicator } from "./status-indicator"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number // -1, 0, 1
  status?: "success" | "warning" | "error" | "info" | "neutral"
  subtitle?: string
  delay?: number
  className?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  status,
  subtitle,
  delay = 0,
  className
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn("group", className)}
    >
      <Card className="relative h-full overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)] hover:shadow-xl transition-all duration-500 hover:border-[var(--brand)]/50">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] group-hover:from-[var(--brand)] group-hover:to-[var(--brand-hover)] transition-all duration-300">
              <Icon className="h-4 w-4 text-[var(--brand)] group-hover:text-white transition-colors" />
            </div>
            {title}
            {status && (
              <StatusIndicator status={status} size="sm" pulse={status === "error" || status === "warning"} />
            )}
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tabular-nums">
            <AnimatedNumber value={value} />
          </CardTitle>
        </CardHeader>
        {subtitle && (
          <CardContent className="pt-0">
            <p className="text-xs text-[var(--ink-muted)]">{subtitle}</p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

