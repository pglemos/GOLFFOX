"use client"

import { motion } from "framer-motion"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { fadeInUp } from "@/lib/animations"

interface ChartContainerPremiumProps {
  title: string
  description?: string
  children: React.ReactNode
  delay?: number
}

export function ChartContainerPremium({ 
  title, 
  description, 
  children,
  delay = 0 
}: ChartContainerPremiumProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-brand-hover to-brand" />
        
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold bg-gradient-to-br from-ink-strong to-ink bg-clip-text text-transparent">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

