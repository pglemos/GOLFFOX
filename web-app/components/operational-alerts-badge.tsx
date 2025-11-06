/**
 * Badge de Alertas Operacionais
 * Exibe contador de alertas não resolvidos no sidebar/topbar
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { getUnresolvedAlerts, hasCriticalAlerts } from '@/lib/operational-alerts'
import { supabase } from '@/lib/supabase'

export function OperationalAlertsBadge() {
  const [alertCount, setAlertCount] = useState(0)
  const [hasCritical, setHasCritical] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadAlerts, 30000)

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('operational_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gf_alerts',
        },
        () => {
          loadAlerts()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [])

  const loadAlerts = async () => {
    try {
      const alerts = await getUnresolvedAlerts()
      setAlertCount(alerts.length)
      setHasCritical(await hasCriticalAlerts())
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || alertCount === 0) {
    return null
  }

  return (
    <Badge
      variant={hasCritical ? 'destructive' : 'secondary'}
      className="flex items-center gap-1 cursor-pointer hover:opacity-80"
      onClick={() => {
        // Navegar para página de alertas ou abrir modal
        window.location.href = '/admin/alertas'
      }}
    >
      <AlertCircle className="h-3 w-3" />
      <span>{alertCount}</span>
    </Badge>
  )
}

