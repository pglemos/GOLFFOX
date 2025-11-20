"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  height?: number
  className?: string
  action?: React.ReactNode
}

export function ChartContainer({
  title,
  description,
  children,
  height = 400,
  className,
  action
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

