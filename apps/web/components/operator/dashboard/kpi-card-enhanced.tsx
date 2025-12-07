"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface KPICardEnhancedProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  subtitle?: string
  delay?: number
}

export function KPICardEnhanced({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bgColor,
  subtitle,
  delay = 0 
}: KPICardEnhancedProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof value === 'number') {
      setDisplayValue(0)
      const duration = 1000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="group"
    >
      <Card className="relative h-full overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)] hover:shadow-xl hover:shadow-[var(--brand)]/10 transition-all duration-500 hover:border-[var(--brand)]/50 cursor-pointer">
        {/* Gradient Background on Hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          initial={false}
        />

        {/* Glow Effect */}
        <motion.div
          className={`absolute -inset-1 ${bgColor} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
          initial={false}
        />

        <CardContent className="relative z-10 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] mb-2 truncate group-hover:text-[var(--ink-strong)] transition-colors">
                {label}
              </p>
              <motion.p
                className={`text-2xl sm:text-3xl font-bold ${color} truncate`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.3, type: "spring" }}
              >
                {typeof value === 'number' ? displayValue.toLocaleString('pt-BR') : value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-[var(--ink-muted)] mt-1 truncate">{subtitle}</p>
              )}
            </div>
            <motion.div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300`}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color}`} />
            </motion.div>
          </div>
        </CardContent>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          initial={false}
        />
      </Card>
    </motion.div>
  )
}

