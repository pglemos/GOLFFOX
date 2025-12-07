"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "neutral"
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

export function StatusIndicator({ 
  status, 
  size = "md", 
  pulse = false,
  className 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  }

  const colorClasses = {
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    error: "bg-[var(--error)]",
    info: "bg-[var(--info)]",
    neutral: "bg-[var(--ink-muted)]"
  }

  return (
    <motion.div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        colorClasses[status],
        className
      )}
      animate={pulse ? {
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1]
      } : {}}
      transition={{
        duration: 2,
        repeat: pulse ? Infinity : 0,
        ease: "easeInOut"
      }}
    />
  )
}

