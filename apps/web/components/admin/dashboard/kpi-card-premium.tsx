"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

interface KPICardPremiumProps {
  icon: LucideIcon
  label: string
  value: number | string
  hint: string
  trend?: number // 1 = up, -1 = down, 0 = neutral, undefined = no trend
  delay?: number
}

export function KPICardPremium({ 
  icon: Icon, 
  label, 
  value, 
  hint, 
  trend,
  delay = 0 
}: KPICardPremiumProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  })

  // Animate number counting
  useEffect(() => {
    if (typeof value === 'number') {
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
    } else {
      setDisplayValue(value as any)
    }
  }, [value])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x - 0.5)
    mouseY.set(y - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group"
    >
      <Card className="relative h-full overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)] hover:shadow-2xl hover:shadow-[var(--brand)]/20 transition-all duration-500 hover:border-[var(--brand)]/50 cursor-pointer">
        {/* Gradient Background on Hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={false}
        />

        {/* Glow Effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
          initial={false}
        />

        <CardHeader className="relative z-10">
          <CardDescription className="flex items-center gap-3 mb-2">
            <motion.div
              className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] group-hover:from-[var(--brand)] group-hover:to-[var(--brand-hover)] transition-all duration-300 shadow-lg group-hover:shadow-[var(--shadow-brand)]"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Icon className="h-5 w-5 text-[var(--brand)] group-hover:text-white transition-colors duration-300" />
            </motion.div>
            <span className="text-sm font-medium text-[var(--ink-strong)]">{label}</span>
          </CardDescription>
          
          <div className="flex items-baseline justify-between gap-2">
            <CardTitle className="text-3xl sm:text-4xl font-bold tabular-nums bg-gradient-to-br from-[var(--ink-strong)] to-[var(--ink)] bg-clip-text text-transparent group-hover:from-[var(--brand)] group-hover:to-[var(--brand-hover)] transition-all duration-300">
              {typeof value === 'number' ? displayValue.toLocaleString('pt-BR') : value}
            </CardTitle>
            
            {trend !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3, type: "spring" }}
              >
                <Badge 
                  variant={trend > 0 ? "default" : trend < 0 ? "destructive" : "outline"}
                  className="flex items-center gap-1 shadow-sm"
                >
                  {trend > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3" />+
                    </>
                  ) : trend < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3" />-
                    </>
                  ) : null}
                </Badge>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardFooter className="relative z-10 flex-col items-start gap-1 pt-0">
          <motion.div
            className="text-xs text-[var(--ink-muted)] group-hover:text-[var(--ink-strong)] transition-colors duration-300"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            {hint}
          </motion.div>
        </CardFooter>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          initial={false}
        />
      </Card>
    </motion.div>
  )
}

