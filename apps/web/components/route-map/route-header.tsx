"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Navigation, Users, Route as RouteIcon, RefreshCw, Maximize2, Minimize2, X } from "lucide-react"
import type { RouteData } from "@/lib/map-utils/route-data-loader"

interface RouteHeaderProps {
  routeData: RouteData
  isMobile: boolean
  formatDuration: (minutes: number) => string
  formatDistance: (meters: number) => string
  onReset?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  onClose?: () => void
  showControls?: boolean
}

export function RouteHeader({
  routeData,
  isMobile,
  formatDuration,
  formatDistance,
  onReset,
  onToggleFullscreen,
  isFullscreen = false,
  onClose,
  showControls = true,
}: RouteHeaderProps) {
  return (
    <Card className="mb-4 p-4 bg-white shadow-sm" role="banner" aria-labelledby="route-title">
      <div
        className={`flex items-center justify-between ${
          isMobile ? 'flex-col gap-4' : 'flex-row'
        }`}
      >
        <div
          className={`flex items-center gap-4 ${
            isMobile ? 'flex-col text-center' : 'flex-row'
          }`}
        >
          <div className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5 text-info" aria-hidden="true" />
            <span id="route-title" className="text-lg font-semibold">
              {routeData?.name || 'Rota'}
            </span>
          </div>
          <div
            className={`flex items-center gap-4 ${
              isMobile ? 'flex-wrap justify-center' : ''
            }`}
            role="list"
            aria-label="Informações da rota"
          >
            <div className="flex items-center gap-2" role="listitem">
              <Clock className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              <span
                className="text-sm text-ink-muted"
                aria-label={`Duração estimada: ${formatDuration(routeData?.estimatedDuration || 0)}`}
              >
                {formatDuration(routeData?.estimatedDuration || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <Navigation className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              <span
                className="text-sm text-ink-muted"
                aria-label={`Distância total: ${formatDistance(routeData?.totalDistance || 0)}`}
              >
                {formatDistance(routeData?.totalDistance || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <Users className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              <span
                className="text-sm text-ink-muted"
                aria-label={`Número de paradas: ${routeData?.stops.length || 0}`}
              >
                {routeData?.stops.length || 0} paradas
              </span>
            </div>
          </div>
        </div>

        {showControls && (onReset || onToggleFullscreen || onClose) && (
          <div
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
            role="toolbar"
            aria-label="Controles do mapa"
          >
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                aria-label="Reiniciar visualização do mapa"
                title="Reiniciar mapa"
              >
                <RefreshCw className="h-4 w-4" />
                {isMobile && <span className="ml-2">Reiniciar</span>}
              </Button>
            )}
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Sair do modo tela cheia' : 'Entrar no modo tela cheia'}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isMobile && <span className="ml-2">{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>}
              </Button>
            )}
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                aria-label="Fechar mapa"
                title="Fechar"
              >
                <X className="h-4 w-4" />
                {isMobile && <span className="ml-2">Fechar</span>}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
