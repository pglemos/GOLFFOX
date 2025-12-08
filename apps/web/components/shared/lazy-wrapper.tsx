"use client"

import React, { Suspense } from "react"
import { cn } from "@/lib/utils"

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

/**
 * Wrapper para lazy loading de componentes pesados
 * Usa Suspense para carregar componentes de forma assíncrona
 */
export function LazyWrapper({ 
  children, 
  fallback,
  className 
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className={cn(
      "flex items-center justify-center p-8",
      className
    )}>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

