"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsiveChartProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  height?: number | string
  mobileHeight?: number | string
}

/**
 * Wrapper para gráficos que se adapta ao tamanho da tela
 * Simplifica visualização em mobile
 */
export function ResponsiveChart({
  title,
  description,
  children,
  className,
  height = 300,
  mobileHeight = 250
}: ResponsiveChartProps) {
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

