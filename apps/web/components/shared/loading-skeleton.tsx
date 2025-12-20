"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { loadingPulse } from "@/lib/animations"

interface LoadingSkeletonProps {
  type?: "card" | "list" | "table" | "kpi"
  count?: number
  className?: string
}

export function LoadingSkeleton({ 
  type = "card", 
  count = 3,
  className 
}: LoadingSkeletonProps) {
  if (type === "kpi") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            variants={loadingPulse}
            initial="hidden"
            animate="visible"
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <div className="h-4 w-24 bg-bg-hover rounded animate-pulse mb-2" />
                <div className="h-8 w-32 bg-bg-hover rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-3 w-16 bg-bg-hover rounded animate-pulse" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            variants={loadingPulse}
            initial="hidden"
            animate="visible"
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-bg-hover animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-bg-hover rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-bg-hover rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  if (type === "table") {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border ${className}`}>
        <CardHeader>
          <div className="h-6 w-48 bg-bg-hover rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <motion.div
                key={i}
                variants={loadingPulse}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 py-3 border-b border-border"
              >
                <div className="h-4 w-16 bg-bg-hover rounded animate-pulse" />
                <div className="h-4 w-32 bg-bg-hover rounded animate-pulse" />
                <div className="h-4 w-24 bg-bg-hover rounded animate-pulse" />
                <div className="h-4 w-20 bg-bg-hover rounded animate-pulse ml-auto" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default: card
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={loadingPulse}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <div className="h-5 w-32 bg-bg-hover rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-bg-hover rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-bg-hover rounded animate-pulse" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

