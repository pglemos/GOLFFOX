"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <Icon className="h-12 w-12 text-ink-light mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-ink-muted mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
      {children}
    </Card>
  )
}

