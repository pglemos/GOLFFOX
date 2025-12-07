"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: string
  children: React.ReactNode
}

export function GradientCard({ gradient = "from-[var(--brand)] to-[var(--brand-hover)]", className, children, ...props }: GradientCardProps) {
  return (
    <Card className={cn("relative overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)]", className)} {...props}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative z-10">
        {children}
      </div>
    </Card>
  )
}

