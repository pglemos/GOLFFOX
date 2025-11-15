'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, MapPin, Phone, Mail, AlertCircle } from 'lucide-react'

interface PassengerInfo {
  id: string
  name: string
  phone?: string
  email?: string
  photo?: string
  type: 'student' | 'employee' | 'visitor'
  observations?: string
}

interface StopInfo {
  id: string
  address: string
  scheduledTime: string
  type: 'pickup' | 'dropoff'
  passenger: PassengerInfo
  coordinates: { lat: number; lng: number }
}

interface AdvancedTooltipProps {
  stop: StopInfo
  isVisible: boolean
  position: { x: number; y: number }
  onClose?: () => void
}

const passengerTypeIcons = {
  student: '🎓',
  employee: '💼',
  visitor: '👤'
}

const passengerTypeColors = {
  student: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
  visitor: 'bg-purple-100 text-purple-800'
}

export function AdvancedTooltip({ stop, isVisible, position, onClose: _onClose }: AdvancedTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current
      const rect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newX = position.x
      let newY = position.y

      // Ajustar posição horizontal
      if (position.x + rect.width > viewportWidth - 20) {
        newX = position.x - rect.width - 20
      }

      // Ajustar posição vertical
      if (position.y + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 20
      }

      setAdjustedPosition({ x: newX, y: newY })
    }
  }, [isVisible, position])

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } catch {
      return timeString
    }
  }

  const truncateObservations = (text: string, maxLength: number = 140) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0, 0.2, 1] 
          }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
          }}
        >
          <Card className="w-80 bg-white border-0 shadow-2xl">
            <CardContent className="p-4 space-y-3">
              {/* Header com foto e informações básicas */}
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border-2 border-gray-200">
                  <AvatarImage 
                    src={stop.passenger.photo} 
                    alt={stop.passenger.name}
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                    {stop.passenger.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {stop.passenger.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-lg" role="img" aria-label={stop.passenger.type}>
                        {passengerTypeIcons[stop.passenger.type]}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${passengerTypeColors[stop.passenger.type]}`}
                      >
                        {stop.passenger.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-600 font-mono">
                      {formatTime(stop.scheduledTime)}
                    </span>
                    <Badge 
                      variant={stop.type === 'pickup' ? 'default' : 'secondary'}
                      className="ml-2 text-xs"
                    >
                      {stop.type === 'pickup' ? 'Embarque' : 'Desembarque'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {stop.address}
                </p>
              </div>

              {/* Informações de contato */}
              {(stop.passenger.phone || stop.passenger.email) && (
                <div className="space-y-1">
                  {stop.passenger.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{stop.passenger.phone}</span>
                    </div>
                  )}
                  {stop.passenger.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{stop.passenger.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {stop.passenger.observations && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">
                        Observações
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        {truncateObservations(stop.passenger.observations)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordenadas (para debug/desenvolvimento) */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-mono">
                  {stop.coordinates.lat.toFixed(6)}, {stop.coordinates.lng.toFixed(6)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AdvancedTooltip