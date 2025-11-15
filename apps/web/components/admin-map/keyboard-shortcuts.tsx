/**
 * Hook para atalhos de teclado do mapa
 */

'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsProps {
  onPlayPause?: () => void
  onStop?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onSpeedUp?: () => void
  onSpeedDown?: () => void
  onToggleHeatmap?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onPlayPause,
  onStop,
  onZoomIn,
  onZoomOut,
  onSpeedUp,
  onSpeedDown,
  onToggleHeatmap,
  enabled = true,
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input/textarea
      if (
        (event.target as HTMLElement).tagName === 'INPUT' ||
        (event.target as HTMLElement).tagName === 'TEXTAREA' ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // Espaço: Play/Pause
      if (event.code === 'Space' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        onPlayPause?.()
        return
      }

      // S: Stop
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault()
        onStop?.()
        return
      }

      // + ou =: Zoom In
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        onZoomIn?.()
        return
      }

      // - ou _: Zoom Out
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        onZoomOut?.()
        return
      }

      // > ou .: Velocidade Up
      if (event.key === '>' || event.key === '.') {
        event.preventDefault()
        onSpeedUp?.()
        return
      }

      // < ou ,: Velocidade Down
      if (event.key === '<' || event.key === ',') {
        event.preventDefault()
        onSpeedDown?.()
        return
      }

      // H: Toggle Heatmap
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault()
        onToggleHeatmap?.()
        return
      }
    },
    [onPlayPause, onStop, onZoomIn, onZoomOut, onSpeedUp, onSpeedDown, onToggleHeatmap]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

