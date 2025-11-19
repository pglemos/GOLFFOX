/**
 * Controles de Playback
 * Timeline, play/pause, velocidade
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, Gauge } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSpeedChange: (speed: 1 | 2 | 4) => void
  progress?: number
  currentTime?: Date
  duration?: Date
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  progress = 0,
  currentTime,
  duration,
}: PlaybackControlsProps) {
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)

  const handleSpeedChange = (newSpeed: 1 | 2 | 4) => {
    setSpeed(newSpeed)
    onSpeedChange(newSpeed)
  }

  return (
    <Card className="p-3 sm:p-4 glass shadow-md sm:shadow-xl max-md:p-2">
      <div className="flex items-center gap-4 max-md:gap-2 max-md:flex-wrap">
        {/* Controles de reprodução */}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => {
              // Skip back 10 segundos (será implementado quando necessário)
            }}
            title="Voltar 10s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={isPlaying ? onPause : onPlay}>
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => {
              // Skip forward 10 segundos (será implementado quando necessário)
            }}
            title="Avançar 10s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline slider */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ink-muted)] w-20 text-right">
              {currentTime ? currentTime.toLocaleTimeString('pt-BR') : '00:00'}
            </span>
            <Slider
              value={[progress]}
              onValueChange={(value) => {
                // Seek to position (será implementado quando necessário)
                // playbackServiceRef.current?.seekTo(new Date(...))
              }}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-[var(--ink-muted)] w-20">
              {duration ? duration.toLocaleTimeString('pt-BR') : '00:00'}
            </span>
          </div>
        </div>

        {/* Velocidade */}
        <div className="flex items-center gap-2 border-l pl-4">
          <Gauge className="h-4 w-4 text-[var(--ink-muted)]" />
          <Button
            size="sm"
            variant={speed === 1 ? 'default' : 'outline'}
            onClick={() => handleSpeedChange(1)}
          >
            1×
          </Button>
          <Button
            size="sm"
            variant={speed === 2 ? 'default' : 'outline'}
            onClick={() => handleSpeedChange(2)}
          >
            2×
          </Button>
          <Button
            size="sm"
            variant={speed === 4 ? 'default' : 'outline'}
            onClick={() => handleSpeedChange(4)}
          >
            4×
          </Button>
        </div>
      </div>
    </Card>
  )
}
