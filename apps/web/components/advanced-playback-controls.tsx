'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward,
  Settings,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  MapPin,
  TrendingUp
} from 'lucide-react'

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  totalDuration: number
  currentStopIndex: number
  totalStops: number
  speed: number
  isLooping: boolean
  isMuted: boolean
  volume: number
}

interface AdvancedPlaybackControlsProps {
  playbackState: PlaybackState
  onPlayPause: () => void
  onReset: () => void
  onProgressChange: (value: number) => void
  onSpeedChange: (speed: number) => void
  onPreviousStop: () => void
  onNextStop: () => void
  onToggleLoop: () => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  className?: string
}

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

export function AdvancedPlaybackControls({
  playbackState,
  onPlayPause,
  onReset,
  onProgressChange,
  onSpeedChange,
  onPreviousStop,
  onNextStop,
  onToggleLoop,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  isFullscreen = false,
  className = ''
}: AdvancedPlaybackControlsProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }, [])

  const getProgressPercentage = () => {
    return playbackState.totalDuration > 0 
      ? (playbackState.currentTime / playbackState.totalDuration) * 100 
      : 0
  }

  const getRemainingTime = () => {
    return playbackState.totalDuration - playbackState.currentTime
  }

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    const newTime = (percentage / 100) * playbackState.totalDuration
    onProgressChange(newTime)
  }

  const handleProgressKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let newTime = playbackState.currentTime
    const step = playbackState.totalDuration * 0.01 // 1% do total

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault()
        newTime = Math.min(playbackState.currentTime + step, playbackState.totalDuration)
        onProgressChange(newTime)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault()
        newTime = Math.max(playbackState.currentTime - step, 0)
        onProgressChange(newTime)
        break
      case 'Home':
        event.preventDefault()
        onProgressChange(0)
        break
      case 'End':
        event.preventDefault()
        onProgressChange(playbackState.totalDuration)
        break
      case 'PageUp':
        event.preventDefault()
        newTime = Math.min(playbackState.currentTime + (playbackState.totalDuration * 0.1), playbackState.totalDuration)
        onProgressChange(newTime)
        break
      case 'PageDown':
        event.preventDefault()
        newTime = Math.max(playbackState.currentTime - (playbackState.totalDuration * 0.1), 0)
        onProgressChange(newTime)
        break
    }
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Informações principais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Status atual */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                playbackState.isPlaying ? 'bg-success-light0 animate-pulse' : 'bg-muted'
              }`} />
              <span className="text-sm font-medium text-ink-strong">
                {playbackState.isPlaying ? 'Reproduzindo' : 'Pausado'}
              </span>
            </div>

            {/* Parada atual */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-info" />
              <span className="text-sm text-ink-muted">
                Parada {playbackState.currentStopIndex + 1} de {playbackState.totalStops}
              </span>
            </div>

            {/* Velocidade */}
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              {playbackState.speed}x
            </Badge>

            {/* Tempo restante */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand" />
              <span className="text-sm text-ink-muted">
                {formatDuration(getRemainingTime())} restantes
              </span>
            </div>
          </div>

          {/* Controles secundários */}
          <div className="flex items-center gap-1">
            {/* Volume */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="h-8 w-8 p-0"
                aria-label={playbackState.isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {playbackState.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute bottom-full mb-2 right-0 bg-white border rounded-lg shadow-lg p-3 w-32"
                  >
                    <Slider
                      value={[playbackState.volume]}
                      onValueChange={(value) => {
                        const newVolume = value[0]
                        if (newVolume !== undefined) {
                          onVolumeChange(newVolume)
                        }
                      }}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-ink-muted text-center mt-1">
                      {playbackState.volume}%
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Loop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleLoop}
              className={`h-8 w-8 p-0 ${
                playbackState.isLooping ? 'text-info bg-info-light' : ''
              }`}
              aria-label={playbackState.isLooping ? 'Desativar loop' : 'Ativar loop'}
            >
              {playbackState.isLooping ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </Button>

            {/* Configurações */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={`h-8 w-8 p-0 ${showSettings ? 'text-info bg-info-light' : ''}`}
              aria-label="Configurações"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Tela cheia */}
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullscreen}
                className="h-8 w-8 p-0"
                aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Configurações expandidas */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t pt-4"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-ink-strong mb-2 block">
                    Velocidade de Reprodução
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {speedOptions.map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackState.speed === speed ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onSpeedChange(speed)}
                        className="text-xs"
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de progresso principal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span className="text-xs">
              {getProgressPercentage().toFixed(1)}% concluído
            </span>
            <span>{formatTime(playbackState.totalDuration)}</span>
          </div>

          {/* Barra de progresso clicável */}
          <div 
            className="relative h-2 bg-muted rounded-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={handleProgressClick}
            onKeyDown={handleProgressKeyDown}
            role="slider"
            tabIndex={0}
            aria-label="Progresso da reprodução"
            aria-valuenow={playbackState.currentTime}
            aria-valuemin={0}
            aria-valuemax={playbackState.totalDuration}
            aria-valuetext={`${formatTime(playbackState.currentTime)} de ${formatTime(playbackState.totalDuration)}`}
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-info-light0 to-info rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Indicador circular */}
            <motion.div
              className="absolute top-1/2 w-4 h-4 bg-white border-2 border-info rounded-full shadow-md transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${getProgressPercentage()}%`, marginLeft: '-8px' }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>
        </div>

        {/* Controles principais */}
        <div className="flex items-center justify-center gap-2">
          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-10 w-10 p-0"
            aria-label="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Parada anterior */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousStop}
            disabled={playbackState.currentStopIndex === 0}
            className="h-10 w-10 p-0"
            aria-label="Parada anterior"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={onPlayPause}
            size="lg"
            className="h-12 w-12 p-0 rounded-full"
            aria-label={playbackState.isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            <motion.div
              key={playbackState.isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {playbackState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.div>
          </Button>

          {/* Próxima parada */}
          <Button
            variant="outline"
            size="sm"
            onClick={onNextStop}
            disabled={playbackState.currentStopIndex >= playbackState.totalStops - 1}
            className="h-10 w-10 p-0"
            aria-label="Próxima parada"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdvancedPlaybackControls