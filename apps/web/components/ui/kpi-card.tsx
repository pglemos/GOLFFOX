"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface KPICardProps {
    title: string
    value: number | string
    prefix?: string
    suffix?: string
    icon?: React.ReactNode
    trend?: { value: number; isPositive: boolean }
    className?: string
    animate?: boolean
    format?: 'number' | 'currency' | 'percent'
}

export function KPICard({
    title,
    value,
    prefix = "",
    suffix = "",
    icon,
    trend,
    className,
    animate = true,
    format = 'number'
}: KPICardProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]+/g, "")) || 0

    useEffect(() => {
        if (!animate || typeof value !== 'number') {
            setDisplayValue(numericValue)
            return
        }

        const duration = 1000
        const steps = 30
        const increment = numericValue / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= numericValue) {
                setDisplayValue(numericValue)
                clearInterval(timer)
            } else {
                setDisplayValue(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [numericValue, animate, value])

    const formatValue = (val: number) => {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
            case 'percent':
                return `${val.toFixed(1)}%`
            default:
                return new Intl.NumberFormat('pt-BR').format(val)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={cn("hover:shadow-md transition-shadow", className)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                            {prefix}{formatValue(displayValue)}{suffix}
                        </span>
                        {trend && (
                            <span className={cn(
                                "text-xs font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
