"use client"

import { RefreshCw, Maximize2, Minimize2, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface MapControlsProps {
  isMobile: boolean
  isFullscreen: boolean
  showControls: boolean
  onReset: () => void
  onToggleFullscreen: () => void
  onClose?: () => void
}

export function MapControls({
  isMobile,
  isFullscreen,
  showControls,
  onReset,
  onToggleFullscreen,
  onClose,
}: MapControlsProps) {
  if (!showControls) return null

  return (
    <div
      className={`flex items-center gap-2 ${
        isMobile ? 'w-full justify-center' : ''
      }`}
      role="toolbar"
      aria-label="Controles do mapa"
    >
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
  )
}
