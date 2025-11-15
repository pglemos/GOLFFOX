"use client"

import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Truck, Route, HelpCircle } from 'lucide-react'

interface ControlTowerCardsProps {
  delays: number
  stoppedVehicles: number
  routeDeviations: number
  openAssistance: number
}

export const ControlTowerCards = memo(function ControlTowerCards({
  delays,
  stoppedVehicles,
  routeDeviations,
  openAssistance
}: ControlTowerCardsProps) {
  const cards = [
    {
      label: 'Atrasos',
      value: delays,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      href: '/operator/alertas?type=route_delayed'
    },
    {
      label: 'Veículos Parados',
      value: stoppedVehicles,
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      href: '/operator/alertas?type=bus_stopped'
    },
    {
      label: 'Desvios de Rota',
      value: routeDeviations,
      icon: Route,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      href: '/operator/alertas?type=route_deviation'
    },
    {
      label: 'Socorros Abertos',
      value: openAssistance,
      icon: HelpCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/operator/alertas?type=assistance_open'
    }
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Torre de Controle</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div key={card.label} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15, ease: 'easeOut' }}>
            {card.value > 0 ? (
              <a href={card.href}>
                <div className={`${card.bgColor} rounded-lg p-4 border border-current/10 hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className={`${card.color} h-5 w-5`} />
                    <span className={`${card.color} text-2xl font-bold`}>{card.value}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{card.label}</p>
                </div>
              </a>
            ) : (
              <div className={`${card.bgColor} rounded-lg p-4 border border-current/10 transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={`${card.color} h-5 w-5`} />
                  <span className={`${card.color} text-2xl font-bold`}>{card.value}</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{card.label}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
})

