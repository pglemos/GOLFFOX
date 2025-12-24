"use client"

import dynamic from "next/dynamic"
import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Lazy load componentes do recharts (bundle grande ~200KB)
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
)
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
)
const PieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

// Exportar componentes lazy para uso em outros lugares
export { LineChart, BarChart, PieChart, ResponsiveContainer }

// Re-exportar outros componentes do recharts que são menores (podem ser importados normalmente)
export {
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface LazyChartProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  height?: number | string
  mobileHeight?: number | string
}

/**
 * Wrapper para gráficos com lazy loading
 * Reduz bundle size inicial carregando recharts apenas quando necessário
 */
export function LazyChart({
  title,
  description,
  children,
  className,
  height = 300,
  mobileHeight = 250
}: LazyChartProps) {
  const isMobile = useMobile()

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description) && (
        <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
          {title && (
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          )}
          {description && (
            <CardDescription className="text-xs sm:text-sm">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent 
        className={cn(
          "px-2 sm:px-6 pt-0",
          isMobile ? "pb-4" : "pb-6"
        )}
        style={{
          height: isMobile ? mobileHeight : height,
          minHeight: isMobile ? mobileHeight : height,
        }}
      >
        <div className="h-full w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

