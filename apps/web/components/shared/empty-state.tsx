"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import { fadeInUp } from "@/lib/animations"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-[var(--border)] border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)]">
              <Icon className="h-12 w-12 text-[var(--brand)]" />
            </div>
          </motion.div>
          <h3 className="text-xl font-semibold text-[var(--ink-strong)] mb-2">
            {title}
          </h3>
          <p className="text-sm text-[var(--ink-muted)] mb-6 max-w-md">
            {description}
          </p>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] hover:from-[var(--brand-hover)] hover:to-[var(--brand)]"
            >
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

