"use client"

import { Card } from "@/components/ui/card"
import { MapPin, Clock, AlertTriangle, TrendingUp, DollarSign, CheckCircle } from "lucide-react"                                                                
import { motion } from "framer-motion"
import operatorI18n from "@/i18n/operator.json"

interface KPICardsProps {
  kpis: {
    trips_today: number
    trips_in_progress: number
    trips_completed: number
    delays_over_5min: number
    avg_occupancy: number
    daily_cost: number
    sla_d0: number
  }
  loading?: boolean
}

export function OperatorKPICards({ kpis, loading = false }: KPICardsProps) {    
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">    
        {[...Array(7)].map((_, i) => (
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
      label: operatorI18n.kpi_trips_today,
      value: kpis.trips_today,
      icon: MapPin,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      label: operatorI18n.kpi_in_progress,
      value: kpis.trips_in_progress,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      label: operatorI18n.kpi_done,
      value: kpis.trips_completed,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      label: operatorI18n.kpi_delays,
      value: kpis.delays_over_5min,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      label: operatorI18n.kpi_occupancy,
      value: `${kpis.avg_occupancy.toFixed(1)}`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      label: operatorI18n.kpi_sla_d0_company,
      value: `${kpis.sla_d0.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      label: operatorI18n.kpi_daily_cost_company,
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.daily_cost || 0),                                               
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">      
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-[var(--ink-muted)] mb-1">{card.label}</p>                                                                          
                  <p className="text-2xl font-bold text-[var(--ink-strong)]">{card.value}</p>                                                                   
                </div>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>                                         
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
