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
  passageiro: PassengerInfo
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
  student: 'bg-info-light text-info',
  employee: 'bg-success-light text-success',
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
                <Avatar className="w-10 h-10 border-2 border-border-light">
                  <AvatarImage 
                    src={stop.passageiro.photo} 
                    alt={stop.passageiro.name}
                  />
                  <AvatarFallback className="bg-muted text-ink-muted text-sm font-medium">
                    {stop.passageiro.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-strong truncate">
                      {stop.passageiro.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-lg" role="img" aria-label={stop.passageiro.type}>
                        {passengerTypeIcons[stop.passageiro.type]}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${passengerTypeColors[stop.passageiro.type]}`}
                      >
                        {stop.passageiro.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-ink-muted" />
                    <span className="text-sm text-ink-muted font-mono">
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
              <div className="flex items-start gap-2 p-2 bg-bg-soft rounded-lg">
                <MapPin className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />
                <p className="text-sm text-ink-strong leading-relaxed">
                  {stop.address}
                </p>
              </div>

              {/* Informações de contato */}
              {(stop.passageiro.phone || stop.passageiro.email) && (
                <div className="space-y-1">
                  {stop.passageiro.phone && (
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{stop.passageiro.phone}</span>
                    </div>
                  )}
                  {stop.passageiro.email && (
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{stop.passageiro.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {stop.passageiro.observations && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">
                        Observações
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        {truncateObservations(stop.passageiro.observations)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordenadas (para debug/desenvolvimento) */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-ink-light font-mono">
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