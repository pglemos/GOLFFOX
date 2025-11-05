/**
 * Hook para monitorar falhas de sincronização e disparar alertas
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getSyncStatus,
  getFailedSyncs,
  getSyncHistory,
} from '@/lib/supabase-sync'

export interface SyncAlert {
  type: 'critical' | 'warning' | 'info'
  message: string
  count: number
  timestamp: string
}

const CRITICAL_THRESHOLD = 5 // Múltiplas falhas consecutivas
const WARNING_THRESHOLD = 3 // Falhas recentes
const FAILURE_RATE_THRESHOLD = 0.1 // 10% de taxa de falha

export function useSyncAlerts() {
  const [alerts, setAlerts] = useState<SyncAlert[]>([])
  const [hasCriticalAlerts, setHasCriticalAlerts] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const checkAlerts = useCallback(() => {
    const status = getSyncStatus()
    const failed = getFailedSyncs()
    const history = getSyncHistory()
    const newAlerts: SyncAlert[] = []

    // Alerta 1: Múltiplas falhas consecutivas
    if (failed.length >= CRITICAL_THRESHOLD) {
      newAlerts.push({
        type: 'critical',
        message: `${failed.length} sincronizações falhando. Ação necessária.`,
        count: failed.length,
        timestamp: new Date().toISOString(),
      })
    }

    // Alerta 2: Taxa de falha alta nas últimas 24h
    const recentHistory = history.filter((entry) => {
      const date = new Date(entry.createdAt)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return date > dayAgo
    })

    if (recentHistory.length > 0) {
      const failures = recentHistory.filter((entry) => !entry.result.success)
      const failureRate = failures.length / recentHistory.length

      if (failureRate >= FAILURE_RATE_THRESHOLD) {
        newAlerts.push({
          type: 'warning',
          message: `Taxa de falha de ${(failureRate * 100).toFixed(1)}% nas últimas 24h`,
          count: failures.length,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Alerta 3: Falhas recentes
    if (status.recentFailures >= WARNING_THRESHOLD) {
      newAlerts.push({
        type: 'warning',
        message: `${status.recentFailures} falhas nas últimas 24h`,
        count: status.recentFailures,
        timestamp: new Date().toISOString(),
      })
    }

    // Alerta 4: Nenhuma sincronização bem-sucedida recentemente
    if (status.lastSyncAt) {
      const lastSync = new Date(status.lastSyncAt)
      const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)

      if (hoursAgo > 24 && recentHistory.length > 0) {
        newAlerts.push({
          type: 'warning',
          message: 'Última sincronização bem-sucedida há mais de 24h',
          count: 1,
          timestamp: new Date().toISOString(),
        })
      }
    }

    setAlerts(newAlerts)
    setHasCriticalAlerts(newAlerts.some((a) => a.type === 'critical'))
    setUnreadCount(newAlerts.length)
  }, [])

  useEffect(() => {
    // Verificar alertas a cada 30 segundos
    checkAlerts()
    const interval = setInterval(checkAlerts, 30000)

    return () => clearInterval(interval)
  }, [checkAlerts])

  const markAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    alerts,
    hasCriticalAlerts,
    unreadCount,
    checkAlerts,
    markAsRead,
  }
}

