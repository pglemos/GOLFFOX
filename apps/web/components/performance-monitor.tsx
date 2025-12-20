'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  HardDrive, 
  Wifi, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  X,
  Minimize2
} from 'lucide-react'
import { usePerformance } from '@/hooks/use-performance'
import { useResponsive } from '@/hooks/use-responsive'

interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compact?: boolean
}

export function PerformanceMonitor({
  isVisible = false,
  onToggle,
  position = 'bottom-right',
  compact = false
}: PerformanceMonitorProps) {
  const { metrics, isPerformanceGood, clearMetrics } = usePerformance()
  const { isMobile } = useResponsive()
  const [isMinimized, setIsMinimized] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (!isVisible) return null

  const getPositionClasses = () => {
    const base = 'fixed z-50'
    switch (position) {
      case 'top-left':
        return `${base} top-4 left-4`
      case 'top-right':
        return `${base} top-4 right-4`
      case 'bottom-left':
        return `${base} bottom-4 left-4`
      case 'bottom-right':
      default:
        return `${base} bottom-4 right-4`
    }
  }

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value <= threshold : value >= threshold
    return isGood ? 'text-success' : 'text-error'
  }

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="w-4 h-4 text-success" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-error" />
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (isMinimized) {
    return (
      <motion.div
        className={getPositionClasses()}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        <Card className="w-16 h-16 cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent 
            className="p-2 flex items-center justify-center"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex flex-col items-center">
              {getStatusIcon(isPerformanceGood)}
              <span className="text-xs font-mono">
                {metrics.fps}fps
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={getPositionClasses()}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <Card className={`${isMobile ? 'w-80' : 'w-96'} shadow-lg border-2 ${
        isPerformanceGood ? 'border-success-light' : 'border-error-light'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
              {getStatusIcon(isPerformanceGood)}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 w-6 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  FPS
                </span>
                <span className={`text-xs font-mono ${getStatusColor(metrics.fps, 30)}`}>
                  {metrics.fps}
                </span>
              </div>
              <Progress 
                value={(metrics.fps / 60) * 100} 
                className="h-1"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  Memory
                </span>
                <span className={`text-xs font-mono ${getStatusColor(metrics.memoryUsage, 50 * 1024 * 1024, true)}`}>
                  {formatBytes(metrics.memoryUsage)}
                </span>
              </div>
              <Progress 
                value={Math.min((metrics.memoryUsage / (100 * 1024 * 1024)) * 100, 100)} 
                className="h-1"
              />
            </div>
          </div>

          {/* Network & Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Latency
              </span>
              <span className={`text-xs font-mono ${getStatusColor(metrics.networkLatency, 1000, true)}`}>
                {formatTime(metrics.networkLatency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Render
              </span>
              <span className={`text-xs font-mono ${getStatusColor(metrics.renderTime, 16.67, true)}`}>
                {formatTime(metrics.renderTime)}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={isPerformanceGood ? "default" : "destructive"}
              className="text-xs"
            >
              {isPerformanceGood ? 'Performance Boa' : 'Performance Baixa'}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
              className="h-6 text-xs"
            >
              Reset
            </Button>
          </div>

          {/* Detailed Metrics */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 border-t pt-2"
              >
                <div className="text-xs text-muted-foreground font-medium">
                  Métricas Detalhadas
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Load Time:</span>
                    <span className="font-mono">{formatTime(metrics.loadTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Cache Hit:</span>
                    <span className="font-mono">{metrics.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Performance Tips */}
                {!isPerformanceGood && (
                  <div className="bg-warning-light dark:bg-warning/20 p-2 rounded text-xs">
                    <div className="font-medium text-warning dark:text-warning-light mb-1">
                      Dicas de Otimização:
                    </div>
                    <ul className="text-warning dark:text-yellow-300 space-y-1">
                      {metrics.fps < 30 && (
                        <li>• Reduza animações complexas</li>
                      )}
                      {metrics.memoryUsage > 50 * 1024 * 1024 && (
                        <li>• Limpe dados não utilizados</li>
                      )}
                      {metrics.networkLatency > 1000 && (
                        <li>• Verifique conexão de rede</li>
                      )}
                      {metrics.renderTime > 16.67 && (
                        <li>• Otimize renderização de componentes</li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hook para controlar o monitor de performance
export function usePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')

  const toggle = () => setIsVisible(!isVisible)
  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return {
    isVisible,
    position,
    setPosition,
    toggle,
    show,
    hide,
  }
}