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
  height = 360,
  className,
  action
}: ChartContainerProps) {
  const shellHeight = `clamp(240px, ${height}px, 70vh)`

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
        <div
          className="w-full"
          style={{
            height: shellHeight
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

