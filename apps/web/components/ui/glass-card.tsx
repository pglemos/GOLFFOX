"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  intensity?: "light" | "medium" | "strong"
}

export function GlassCard({ intensity = "medium", className, children, ...props }: GlassCardProps) {
  const intensityClasses = {
    light: "bg-card/30 backdrop-blur-sm",
    medium: "bg-card/50 backdrop-blur-md",
    strong: "bg-card/70 backdrop-blur-lg"
  }

  return (
    <Card 
      className={cn(
        intensityClasses[intensity],
        "border-border shadow-lg",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

