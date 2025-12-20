'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Stop {
  id: string
  scheduledTime: string
  address: string
  type: 'pickup' | 'dropoff'
}

interface TemporalProgressBarProps {
  stops: Stop[]
  currentTime?: Date
  isPlaying?: boolean
  onPlayPause?: (_playing: boolean) => void
  onReset?: () => void
  onProgressChange?: (_progress: number) => void
}

export function TemporalProgressBar({
  stops,
  currentTime = new Date(),
  isPlaying: _isPlaying = false,
  onPlayPause,
  onReset,
  onProgressChange
}: TemporalProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [_totalDuration, setTotalDuration] = useState(0)

  // Calcular duração total e progresso
  useEffect(() => {
    if (stops.length < 2) return

    const firstStop = stops[0]
    const lastStop = stops[stops.length - 1]
    
    if (!firstStop || !lastStop) return
    
    const startTime = new Date(firstStop.scheduledTime)
    const endTime = new Date(lastStop.scheduledTime)
    const total = endTime.getTime() - startTime.getTime()
    const elapsed = currentTime.getTime() - startTime.getTime()
    
    setTotalDuration(total)
    
    if (elapsed < 0) {
      setProgress(0)
      setCurrentStopIndex(0)
    } else if (elapsed > total) {
      setProgress(100)
      setCurrentStopIndex(stops.length - 1)
    } else {
      const progressPercent = (elapsed / total) * 100
      setProgress(progressPercent)
      
      // Encontrar parada atual
      const currentIndex = stops.findIndex((stop, index) => {
        if (index === stops.length - 1) return true
        const nextStop = stops[index + 1]
        if (!nextStop) return true
        const stopTime = new Date(stop.scheduledTime).getTime()
        const nextStopTime = new Date(nextStop.scheduledTime).getTime()
        return currentTime.getTime() >= stopTime && currentTime.getTime() < nextStopTime
      })
      
      setCurrentStopIndex(Math.max(0, currentIndex))
    }

    // Calcular tempo restante
    const remaining = endTime.getTime() - currentTime.getTime()
    if (remaining > 0) {
      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} restantes`)
    } else {
      setTimeRemaining('Rota concluída')
    }
  }, [stops, currentTime])

  // Notificar mudanças de progresso
  useEffect(() => {
    onProgressChange?.(progress)
  }, [progress, onProgressChange])

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

  const calculateStopProgress = (index: number) => {
    if (stops.length < 2) return 0
    
    const firstStop = stops[0]
    const lastStop = stops[stops.length - 1]
    const currentStop = stops[index]
    
    if (!firstStop || !lastStop || !currentStop) return 0
    
    const startTime = new Date(firstStop.scheduledTime).getTime()
    const endTime = new Date(lastStop.scheduledTime).getTime()
    const stopTime = new Date(currentStop.scheduledTime).getTime()
    
    return ((stopTime - startTime) / (endTime - startTime)) * 100
  }

  const getStopStatus = (index: number) => {
    if (index < currentStopIndex) return 'completed'
    if (index === currentStopIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="w-full bg-white border-t border-border-light p-4 space-y-4">
      {/* Cabeçalho com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlayPause?.(!_isPlaying)}
              className="w-8 h-8 p-0"
            >
              {_isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-8 h-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-muted" />
            <span className="text-sm font-medium text-ink-strong">
              {Math.round(progress)}% concluído
            </span>
          </div>
        </div>
        
        <div className="text-sm text-ink-muted font-mono">
          {timeRemaining}
        </div>
      </div>

      {/* Barra de progresso principal */}
      <div className="relative">
        <Progress value={progress} className="h-2" />
        
        {/* Indicador circular móvel */}
        <motion.div
          className="absolute top-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg transform -translate-y-1/2"
          style={{ left: `${progress}%` }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Linha do tempo com paradas */}
      <div className="relative">
        <div className="flex justify-between items-center">
          {stops.map((stop, index) => {
            const stopProgress = calculateStopProgress(index)
            const status = getStopStatus(index)
            
            return (
              <motion.div
                key={stop.id}
                className="flex flex-col items-center relative"
                style={{ left: `${stopProgress}%` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Marcador da parada */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-success-light0 border-success'
                      : status === 'current'
                      ? 'bg-primary border-primary animate-pulse'
                      : 'bg-white border-border'
                  }`}
                />
                
                {/* Número da parada */}
                <div
                  className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-success-light text-success'
                      : status === 'current'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-ink-muted'
                  }`}
                >
                  {index + 1}
                </div>
                
                {/* Horário */}
                <div className="mt-1 text-xs text-ink-muted font-mono">
                  {formatTime(stop.scheduledTime)}
                </div>
                
                {/* Tipo de parada */}
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full ${
                  stop.type === 'pickup' 
                    ? 'bg-info-light text-info' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {stop.type === 'pickup' ? 'Embarque' : 'Desembarque'}
                </div>
                
                {/* Duração até próxima parada */}
                {index < stops.length - 1 && (
                  <div className="absolute top-8 left-full ml-2 text-xs text-ink-muted whitespace-nowrap">
                    {(() => {
                      const nextStop = stops[index + 1]
                      if (!nextStop) return ''
                      const currentStopTime = new Date(stop.scheduledTime)
                      const nextStopTime = new Date(nextStop.scheduledTime)
                      const duration = nextStopTime.getTime() - currentStopTime.getTime()
                      const minutes = Math.round(duration / (1000 * 60))
                      return `${minutes}min`
                    })()}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Informações da parada atual */}
      {stops[currentStopIndex] && (
        <motion.div
          className="p-3 bg-bg-soft rounded-lg border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStopIndex}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-ink-strong">
                Parada {currentStopIndex + 1} de {stops.length}
              </h4>
              <p className="text-sm text-ink-muted mt-1">
                {stops[currentStopIndex].address}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-ink-strong">
                {formatTime(stops[currentStopIndex].scheduledTime)}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                stops[currentStopIndex].type === 'pickup'
                  ? 'bg-info-light text-info'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {stops[currentStopIndex].type === 'pickup' ? 'Embarque' : 'Desembarque'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TemporalProgressBar