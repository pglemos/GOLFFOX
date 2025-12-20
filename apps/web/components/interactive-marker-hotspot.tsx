'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  User, 
  Navigation,
  X,
  ChevronRight
} from 'lucide-react'

interface PassageiroDetails {
  id: string
  name: string
  photo?: string
  type: 'regular' | 'elderly' | 'disabled' | 'student'
  phone?: string
  observations?: string
  rating?: number
}

interface StopDetails {
  id: string
  type: 'pickup' | 'dropoff'
  address: string
  scheduledTime: string
  passageiro: PassageiroDetails
  coordinates: { lat: number; lng: number }
  stopNumber: number
  isCompleted: boolean
  isCurrent: boolean
}

interface InteractiveMarkerHotspotProps {
  stop: StopDetails
  position: { x: number; y: number }
  onClose: () => void
  onCenterMap: (_coordinates: { lat: number; lng: number }) => void
  className?: string
}

const passengerTypeConfig = {
  regular: { 
    icon: User, 
    label: 'Regular', 
    color: 'bg-info-light text-info',
    iconColor: 'text-info'
  },
  elderly: { 
    icon: User, 
    label: 'Idoso', 
    color: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-600'
  },
  disabled: { 
    icon: User, 
    label: 'PCD', 
    color: 'bg-brand-light text-brand',
    iconColor: 'text-brand'
  },
  student: { 
    icon: User, 
    label: 'Estudante', 
    color: 'bg-success-light text-success',
    iconColor: 'text-success'
  }
}

export function InteractiveMarkerHotspot({
  stop,
  position,
  onClose,
  onCenterMap,
  className = ''
}: InteractiveMarkerHotspotProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const passengerConfig = passengerTypeConfig[stop.passageiro.type]
  const PassengerIcon = passengerConfig.icon

  // Ajustar posição para manter o card visível na tela
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let newX = position.x
      let newY = position.y

      // Ajustar horizontalmente
      if (position.x + rect.width > viewportWidth - 20) {
        newX = viewportWidth - rect.width - 20
      }
      if (newX < 20) {
        newX = 20
      }

      // Ajustar verticalmente
      if (position.y + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 40
      }
      if (newY < 20) {
        newY = 20
      }

      setAdjustedPosition({ x: newX, y: newY })
    }
  }, [position, isExpanded])

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleCenterMap = () => {
    onCenterMap(stop.coordinates)
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        className={`fixed z-50 ${className}`}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Card className="w-[calc(100vw-2rem)] sm:w-80 max-w-sm shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-info-light to-indigo-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  stop.type === 'pickup' ? 'bg-success-light' : 'bg-error-light'
                }`}>
                  <MapPin className={`w-4 h-4 ${
                    stop.type === 'pickup' ? 'text-success' : 'text-error'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-ink-strong truncate">
                    Parada #{stop.stopNumber}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      stop.type === 'pickup' 
                        ? 'bg-success-light text-success' 
                        : 'bg-error-light text-error'
                    }`}
                  >
                    {stop.type === 'pickup' ? 'Embarque' : 'Desembarque'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                  aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  aria-label="Fechar detalhes"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Informações básicas */}
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {/* Passageiro */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarImage src={stop.passageiro.photo} alt={stop.passageiro.name} />
                  <AvatarFallback className="text-xs sm:text-sm font-medium">
                    {getInitials(stop.passageiro.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm text-ink-strong truncate">{stop.passageiro.name}</p>
                  <Badge className={`text-xs ${passengerConfig.color}`}>
                    <PassengerIcon className={`w-3 h-3 mr-1 ${passengerConfig.iconColor}`} />
                    {passengerConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Endereço */}
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-ink-muted mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-ink-strong leading-relaxed break-words">
                  {stop.address}
                </p>
              </div>

              {/* Horário */}
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-ink-muted" />
                <p className="text-xs sm:text-sm text-ink-strong">
                  Previsto para <span className="font-medium">{formatTime(stop.scheduledTime)}</span>
                </p>
              </div>
            </div>

            {/* Detalhes expandidos */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t bg-bg-soft/50">
                    {/* Telefone */}
                    {stop.passageiro.phone && (
                      <div className="flex items-center gap-2 pt-3">
                        <Phone className="w-4 h-4 text-ink-muted" />
                        <a 
                          href={`tel:${stop.passageiro.phone}`}
                          className="text-sm text-info hover:text-info transition-colors"
                        >
                          {stop.passageiro.phone}
                        </a>
                      </div>
                    )}

                    {/* Observações */}
                    {stop.passageiro.observations && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-ink-muted mb-1">Observações:</p>
                          <p className="text-sm text-ink-strong leading-relaxed">
                            {stop.passageiro.observations.length > 140 
                              ? `${stop.passageiro.observations.slice(0, 140)}...`
                              : stop.passageiro.observations
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="pt-2">
                      <Button
                        onClick={handleCenterMap}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Centralizar no Mapa
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Seta apontando para o marcador */}
        <div 
          className="absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
          style={{
            left: '50%',
            bottom: '-8px',
            transform: 'translateX(-50%)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default InteractiveMarkerHotspot