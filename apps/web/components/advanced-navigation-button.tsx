"use client"

import { useState, useCallback } from 'react'

import { motion } from 'framer-motion'
import { MapPin, Loader2 } from 'lucide-react'

import { useAdvancedNavigation } from '@/hooks/use-advanced-navigation'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/logger'

import { Button } from './ui/button'

interface RoutePoint {
  lat: number
  lng: number
  address: string
  stop_name: string
  passenger_name?: string
  estimated_arrival?: string
}

interface AdvancedNavigationButtonProps {
  routeId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function AdvancedNavigationButton({
  routeId,
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}: AdvancedNavigationButtonProps) {
  const { navigateToTab, isTransitioning } = useAdvancedNavigation()
  const [isLoading, setIsLoading] = useState(false)

  // Buscar pontos da rota para cálculo de zoom
  const fetchRoutePoints = useCallback(async (id: string): Promise<RoutePoint[]> => {
    try {
      const { data, error } = await supabase
        .from('gf_rota_plano')
        .select(`
          latitude,
          longitude,
          address,
          stop_name,
          passageiro_id,
          estimated_arrival_time,
          gf_employee_company!inner(name)
        `)
        .eq('route_id', id)
        .order('stop_order')

      if (error) throw error

      import type { Database } from '@/types/supabase'
      type GfRotaPlanoRow = Database['public']['Tables']['gf_rota_plano']['Row']
      return data?.map((point: GfRotaPlanoRow) => ({
        lat: point.latitude,
        lng: point.longitude,
        address: point.address || '',
        stop_name: point.stop_name || '',
        passenger_name: point.gf_employee_company?.name || '',
        estimated_arrival: point.estimated_arrival_time
      })) || []
    } catch (error) {
      logError('Erro ao buscar pontos da rota', { error }, 'AdvancedNavigationButton')
      return []
    }
  }, [])

  // Handler do clique com todas as funcionalidades
  const handleMapNavigation = useCallback(async () => {
    if (isTransitioning || isLoading) return

    setIsLoading(true)

    try {
      let routePoints: Array<{ lat: number; lng: number }> = []

      // Se há uma rota específica, buscar seus pontos
      if (routeId) {
        const points = await fetchRoutePoints(routeId)
        routePoints = points.map(p => ({ lat: p.lat, lng: p.lng }))
      }

      // Executar navegação avançada com todas as especificações
      await navigateToTab('mapa', routePoints, {
        preloadAssets: true,
        transitionDuration: 300,
        maintainState: true,
        calculateZoom: true
      })

    } catch (error) {
      logError('Erro na navegação para o mapa', { error }, 'AdvancedNavigationButton')
    } finally {
      setIsLoading(false)
    }
  }, [routeId, isTransitioning, isLoading, navigateToTab, fetchRoutePoints])

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Button
        variant={variant}
        size={size}
        className={`relative overflow-hidden ${className}`}
        onClick={handleMapNavigation}
        disabled={isTransitioning || isLoading}
      >
        {/* Efeito de ripple ao clicar */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 4, opacity: [0, 1, 0] }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Conteúdo do botão */}
        <div className="relative flex items-center gap-2">
          {isLoading || isTransitioning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {children || 'Mapa'}
        </div>

        {/* Indicador de progresso */}
        {(isLoading || isTransitioning) && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-info-light0"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        )}
      </Button>
    </motion.div>
  )
}

// Componente de navegação rápida para múltiplas abas
interface QuickNavigationProps {
  currentTab: string
  routeId?: string
  className?: string
}

export function QuickNavigation({ currentTab, routeId, className = '' }: QuickNavigationProps) {
  const { navigateToTab, isTransitioning } = useAdvancedNavigation()

  const tabs = [
    { id: 'rotas', label: 'Rotas', icon: '🗺️' },
    { id: 'mapa', label: 'Mapa', icon: '📍' },
    { id: 'veiculos', label: 'Veículos', icon: '🚌' },
    { id: 'motoristas', label: 'Motoristas', icon: '👨‍💼' }
  ]

  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentTab === tab.id
              ? 'bg-info-light text-info shadow-sm'
              : 'text-ink-muted hover:bg-muted hover:text-ink-strong'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateToTab(tab.id)}
          disabled={isTransitioning || currentTab === tab.id}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </motion.button>
      ))}
    </div>
  )
}