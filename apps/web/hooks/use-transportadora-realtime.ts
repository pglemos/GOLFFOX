import { useEffect, useRef, useCallback } from 'react'

import { supabase } from '@/lib/supabase'

import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseTransportadoraRealtimeOptions {
  /**
   * ID da transportadora
   */
  transportadoraId: string | null
  /**
   * Função para recarregar dados da frota
   */
  onDataUpdate: () => void | Promise<void>
  /**
   * Habilitar polling fallback (padrão: true)
   */
  enablePolling?: boolean
  /**
   * Intervalo de polling em ms (padrão: 60000 = 1 minuto)
   */
  pollingInterval?: number
}

/**
 * Hook para gerenciar subscriptions do Supabase realtime e polling fallback
 * para dados da transportadora
 * 
 * @example
 * useTransportadoraRealtime({
 *   transportadoraId: user?.transportadora_id,
 *   onDataUpdate: loadFleetData,
 *   enablePolling: true,
 *   pollingInterval: 60000
 * })
 */
export function useTransportadoraRealtime({
  transportadoraId,
  onDataUpdate,
  enablePolling = true,
  pollingInterval = 60000,
}: UseTransportadoraRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Wrapper para onDataUpdate que verifica se componente ainda está montado
  const safeOnDataUpdate = useCallback(async () => {
    if (!isMountedRef.current) return
    try {
      await onDataUpdate()
    } catch (error) {
      logError('Erro ao atualizar dados', { error }, 'UseTransportadoraRealtime')
    }
  }, [onDataUpdate])

  useEffect(() => {
    isMountedRef.current = true

    if (!transportadoraId) {
      return
    }

    // Criar channel do Supabase realtime
    const channel = supabase
      .channel('transportadora-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motorista_positions'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_passageiros'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_documents'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_maintenances'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_costs'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'route_costs'
        },
        () => {
          safeOnDataUpdate()
        }
      )
      .subscribe()

    channelRef.current = channel

    // Polling fallback
    if (enablePolling) {
      intervalRef.current = setInterval(() => {
        safeOnDataUpdate()
      }, pollingInterval)
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [transportadoraId, enablePolling, pollingInterval, safeOnDataUpdate])

  // Cleanup adicional quando componente desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
}

