"use client"

import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Truck, Route, HelpCircle } from 'lucide-react'
import { t } from '@/lib/i18n'

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
      label: t('operator', 'control_tower_delays'),
      value: delays,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      href: '/operador/alertas?type=route_delayed'
    },
    {
      label: t('operator', 'control_tower_stopped'),
      value: stoppedVehicles,
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      href: '/operador/alertas?type=bus_stopped'
    },
    {
      label: t('operator', 'control_tower_deviations'),
      value: routeDeviations,
      icon: Route,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      href: '/operador/alertas?type=deviation'
    },
    {
      label: t('operator', 'control_tower_assistance'),
      value: openAssistance,
      icon: HelpCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/operador/alertas?type=assistance_open'
    }
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="touch-manipulation"
          >
            {card.value > 0 ? (
              <a href={card.href} className="block">
                <div className={`${card.bgColor} rounded-lg p-3 sm:p-4 border border-current/10 hover:shadow-md active:shadow-sm transition-shadow cursor-pointer min-h-[100px] sm:min-h-[120px]`}>
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className={`${card.color} h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0`} />
                    <span className={`${card.color} text-xl sm:text-2xl font-bold`}>{card.value}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">{card.label}</p>
                </div>
              </a>
            ) : (
              <div className={`${card.bgColor} rounded-lg p-3 sm:p-4 border border-current/10 transition-shadow min-h-[100px] sm:min-h-[120px]`}>
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={`${card.color} h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0`} />
                  <span className={`${card.color} text-xl sm:text-2xl font-bold`}>{card.value}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">{card.label}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
})

