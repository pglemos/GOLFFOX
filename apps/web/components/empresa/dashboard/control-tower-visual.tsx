"use client"

import { motion } from "framer-motion"
import { LucideIcon, AlertCircle, Truck, Route, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const Link: any = require("next/link")

interface ControlTowerItem {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  href: string
}

interface ControlTowerVisualProps {
  delays: number
  stoppedVehicles: number
  routeDeviations: number
  openAssistance: number
  labels: {
    delays: string
    stopped: string
    deviations: string
    assistance: string
  }
}

export function ControlTowerVisual({
  delays,
  stoppedVehicles,
  routeDeviations,
  openAssistance,
  labels
}: ControlTowerVisualProps) {
  const items: ControlTowerItem[] = [
    {
      label: labels.delays,
      value: delays,
      icon: AlertCircle,
      color: 'text-error',
      bgColor: 'bg-error-light',
      borderColor: 'border-error-light',
      href: '/operador/alertas?type=route_delayed'
    },
    {
      label: labels.stopped,
      value: stoppedVehicles,
      icon: Truck,
      color: 'text-brand',
      bgColor: 'bg-brand-light',
      borderColor: 'border-brand-soft',
      href: '/operador/alertas?type=bus_stopped'
    },
    {
      label: labels.deviations,
      value: routeDeviations,
      icon: Route,
      color: 'text-warning',
      bgColor: 'bg-warning-light',
      borderColor: 'border-warning-light',
      href: '/operador/alertas?type=deviation'
    },
    {
      label: labels.assistance,
      value: openAssistance,
      icon: HelpCircle,
      color: 'text-info',
      bgColor: 'bg-info-light',
      borderColor: 'border-info-light',
      href: '/operador/alertas?type=assistance_open'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon
        const hasIssues = item.value > 0
        
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group"
          >
            {hasIssues ? (
              <Link href={item.href} className="block h-full">
                <Card className={`relative h-full overflow-hidden bg-card/50 backdrop-blur-sm border-2 ${item.borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer ${hasIssues ? 'ring-2 ring-offset-2 ring-error/50' : ''}`}>
                  {/* Pulse Animation for Issues */}
                  {hasIssues && (
                    <motion.div
                      className={`absolute inset-0 ${item.bgColor} opacity-20`}
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  <CardContent className="relative z-10 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <motion.div
                        className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </motion.div>
                      {hasIssues && (
                        <motion.div
                          className="w-3 h-3 rounded-full bg-error-light0"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </div>
                    <motion.p
                      className={`text-3xl sm:text-4xl font-bold ${item.color} mb-2`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    >
                      {item.value}
                    </motion.p>
                    <p className="text-sm font-medium text-ink-strong group-hover:text-brand transition-colors">
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className={`relative h-full overflow-hidden bg-card/50 backdrop-blur-sm border ${item.borderColor} transition-all duration-300`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center shadow-lg`}>
                      <Icon className={`h-6 w-6 ${item.color} opacity-60`} />
                    </div>
                  </div>
                  <p className={`text-3xl sm:text-4xl font-bold ${item.color} mb-2 opacity-60`}>
                    {item.value}
                  </p>
                  <p className="text-sm font-medium text-ink-muted">
                    {item.label}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

