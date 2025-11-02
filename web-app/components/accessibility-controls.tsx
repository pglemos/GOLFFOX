'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accessibility,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Keyboard,
  MousePointer,
  Contrast,
  Type,
  Zap,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  SkipForward
} from 'lucide-react'
import { useAccessibility } from '@/hooks/use-accessibility'
import { useResponsive } from '@/hooks/use-responsive'

interface AccessibilityControlsProps {
  isVisible?: boolean
  onToggle?: () => void
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function AccessibilityControls({
  isVisible = false,
  onToggle,
  position = 'top-right'
}: AccessibilityControlsProps) {
  const { 
    state, 
    announce, 
    skipToContent, 
    toggleHighContrast 
  } = useAccessibility()
  const { isMobile } = useResponsive()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(!state.reducedMotion)
  const [focusIndicatorEnabled, setFocusIndicatorEnabled] = useState(true)

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

  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0]
    setFontSize(newSize)
    document.documentElement.style.fontSize = `${newSize}px`
    announce(`Tamanho da fonte alterado para ${newSize} pixels`)
  }

  const handleAnimationToggle = (enabled: boolean) => {
    setAnimationsEnabled(enabled)
    if (enabled) {
      document.documentElement.classList.remove('reduce-motion')
    } else {
      document.documentElement.classList.add('reduce-motion')
    }
    announce(enabled ? 'Animações ativadas' : 'Animações desativadas')
  }

  const handleFocusIndicatorToggle = (enabled: boolean) => {
    setFocusIndicatorEnabled(enabled)
    if (enabled) {
      document.documentElement.classList.remove('no-focus-ring')
    } else {
      document.documentElement.classList.add('no-focus-ring')
    }
    announce(enabled ? 'Indicadores de foco ativados' : 'Indicadores de foco desativados')
  }

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    announce(enabled ? 'Sons de interface ativados' : 'Sons de interface desativados')
  }

  const resetToDefaults = () => {
    setFontSize(16)
    setSoundEnabled(true)
    setAnimationsEnabled(!state.reducedMotion)
    setFocusIndicatorEnabled(true)
    
    document.documentElement.style.fontSize = '16px'
    document.documentElement.classList.remove('reduce-motion', 'no-focus-ring', 'high-contrast')
    
    announce('Configurações de acessibilidade restauradas para o padrão')
  }

  return (
    <motion.div
      className={getPositionClasses()}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <Card className={`${isMobile ? 'w-80' : 'w-96'} shadow-lg border-2 border-blue-200`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              Controles de Acessibilidade
              {state.isScreenReaderActive && (
                <Badge variant="secondary" className="text-xs">
                  Leitor de Tela
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
                aria-label={isExpanded ? 'Recolher controles' : 'Expandir controles'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 w-6 p-0"
                  aria-label="Fechar controles de acessibilidade"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={skipToContent}
              className="text-xs flex items-center gap-1"
            >
              <SkipForward className="w-3 h-3" />
              Pular para Conteúdo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHighContrast}
              className="text-xs flex items-center gap-1"
            >
              <Contrast className="w-3 h-3" />
              Alto Contraste
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-1">
            {state.isKeyboardUser && (
              <Badge variant="secondary" className="text-xs">
                <Keyboard className="w-3 h-3 mr-1" />
                Teclado
              </Badge>
            )}
            {state.reducedMotion && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Movimento Reduzido
              </Badge>
            )}
            {state.highContrastMode && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Alto Contraste
              </Badge>
            )}
          </div>

          {/* Expanded Controls */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 border-t pt-3"
              >
                {/* Font Size Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Type className="w-4 h-4" />
                      Tamanho da Fonte
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {fontSize}px
                    </span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    onValueChange={handleFontSizeChange}
                    min={12}
                    max={24}
                    step={1}
                    className="w-full"
                    aria-label="Ajustar tamanho da fonte"
                  />
                </div>

                <Separator />

                {/* Toggle Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Volume2 className="w-4 h-4" />
                      Sons de Interface
                    </label>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={handleSoundToggle}
                      aria-label="Ativar/desativar sons de interface"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Animações
                    </label>
                    <Switch
                      checked={animationsEnabled}
                      onCheckedChange={handleAnimationToggle}
                      aria-label="Ativar/desativar animações"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <MousePointer className="w-4 h-4" />
                      Indicadores de Foco
                    </label>
                    <Switch
                      checked={focusIndicatorEnabled}
                      onCheckedChange={handleFocusIndicatorToggle}
                      aria-label="Ativar/desativar indicadores de foco"
                    />
                  </div>
                </div>

                <Separator />

                {/* Keyboard Shortcuts Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Atalhos de Teclado
                  </div>
                  <div className="text-blue-700 dark:text-blue-300 space-y-1">
                    <div><kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Alt + S</kbd> - Pular para conteúdo</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Alt + H</kbd> - Alto contraste</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Esc</kbd> - Fechar modais</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Tab</kbd> - Navegar elementos</div>
                  </div>
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  className="w-full text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Restaurar Padrões
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hook para controlar os controles de acessibilidade
export function useAccessibilityControls() {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right')

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