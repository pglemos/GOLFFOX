"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  href: string
  gradient: string
  bgGradient: string
}

interface QuickActionsGridProps {
  actions: QuickAction[]
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <a href={action.href} className="block h-full group">
              <Card variant="premium" className="relative h-full overflow-hidden cursor-pointer">
                {/* Gradient Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  initial={false}
                />

                {/* Glow Effect */}
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                  initial={false}
                />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-brand transition-colors duration-300">
                        {action.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-ink-muted group-hover:text-text-ink-strong transition-colors duration-300">
                        {action.description}
                      </p>
                    </div>
                    <motion.div
                      className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <motion.div
                    className="h-32 sm:h-40 rounded-xl bg-gradient-to-br from-text-brand/10 via-text-brand/5 to-accent-custom/10 flex items-center justify-center group-hover:from-text-brand/25 group-hover:via-text-brand/15 group-hover:to-accent-custom/25 transition-all duration-500 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-text-brand/20 to-transparent opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.5 }}
                    />
                    <Icon className="h-16 w-16 text-brand opacity-30 group-hover:opacity-70 transition-all duration-500 relative z-10 drop-shadow-lg" />
                  </motion.div>
                </CardContent>

                {/* Arrow Indicator */}
                <motion.div
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                >
                  <ArrowUpRight className="h-5 w-5 text-brand" />
                </motion.div>

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  initial={false}
                />
              </Card>
            </a>
          </motion.div>
        )
      })}
    </div>
  )
}

