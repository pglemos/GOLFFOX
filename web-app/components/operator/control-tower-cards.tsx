"use client"

// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { AlertTriangle, Navigation, Truck, LifeBuoy } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
// @ts-ignore
import { cn } from "@/lib/utils"

interface ControlTowerCardsProps {
  delays: number
  stoppedVehicles: number
  routeDeviations: number
  openAssistance: number
  loading?: boolean
}

export function ControlTowerCards({
  delays,
  stoppedVehicles,
  routeDeviations,
  openAssistance,
  loading = false
}: ControlTowerCardsProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Atrasos",
      value: delays,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50",
      action: () => router.push('/operator/alertas?filter=delay'),
      severity: delays > 10 ? 'high' : delays > 5 ? 'medium' : 'low'
    },
    {
      label: "Veículo Parado",
      value: stoppedVehicles,
      icon: Truck,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      action: () => router.push('/operator/alertas?filter=stopped'),
      severity: stoppedVehicles > 3 ? 'high' : stoppedVehicles > 1 ? 'medium' : 'low'
    },
    {
      label: "Desvios",
      value: routeDeviations,
      icon: Navigation,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      action: () => router.push('/operator/alertas?filter=deviation'),
      severity: routeDeviations > 2 ? 'high' : routeDeviations > 0 ? 'medium' : 'low'
    },
    {
      label: "Socorro Aberto",
      value: openAssistance,
      icon: LifeBuoy,
      color: "text-red-600",
      bgColor: "bg-red-100",
      action: () => router.push('/operator/solicitacoes?filter=socorro'),
      severity: openAssistance > 0 ? 'high' : 'low'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isUrgent = card.severity === 'high' && card.value > 0
        
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={cn(
                "p-4 cursor-pointer transition-all",
                isUrgent && "ring-2 ring-red-500 ring-opacity-50 shadow-lg"
              )}
              onClick={card.action}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                {isUrgent && (
                  <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full">
                    Urgente
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--ink-muted)] mb-1">{card.label}</p>
              <p className={cn(
                "text-3xl font-bold mb-3",
                isUrgent ? "text-red-600" : "text-[var(--ink-strong)]"
              )}>
                {card.value}
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                e.stopPropagation()
                card.action()
              }}>
                Ver Detalhes
              </Button>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

