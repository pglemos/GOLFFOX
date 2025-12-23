"use client"

import React from "react"

import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface MobileFormLayoutProps {
  children: React.ReactNode
  className?: string
  gap?: "sm" | "md" | "lg"
}

/**
 * Layout de formulário otimizado para mobile
 * Em mobile: layout vertical com espaçamento adequado
 * Em desktop: pode usar grid ou layout mais complexo
 */
export function MobileFormLayout({
  children,
  className,
  gap = "md"
}: MobileFormLayoutProps) {
  const isMobile = useMobile()

  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6"
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        isMobile ? gapClasses[gap] : `sm:grid sm:grid-cols-2 ${gapClasses[gap]}`,
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Wrapper para campos de formulário com label e input
 * Otimizado para mobile com tamanhos adequados
 */
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className
}: FormFieldProps) {
  const isMobile = useMobile()

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className={cn(
        isMobile && "min-h-[44px]"
      )}>
        {children}
      </div>
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

