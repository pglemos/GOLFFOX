"use client"

import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  variant?: "spinner" | "inline"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

/**
 * Componente de loading spinner reutilizável
 * 
 * @example
 * // Spinner simples
 * <LoadingSpinner />
 * 
 * @example
 * // Spinner com texto
 * <LoadingSpinner text="Carregando..." />
 * 
 * @example
 * // Spinner inline em botão
 * <LoadingSpinner size="sm" variant="inline" />
 */
export function LoadingSpinner({
  size = "md",
  className,
  text,
  variant = "spinner",
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        variant === "inline" && "mr-2 flex-shrink-0",
        className
      )}
    />
  )

  if (variant === "inline") {
    return spinner
  }

  if (text) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
        {spinner}
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {spinner}
    </div>
  )
}

