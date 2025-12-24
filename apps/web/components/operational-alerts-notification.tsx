/**
 * Notificação de Alertas Operacionais no Topbar
 * Exibe dropdown com alertas críticos não resolvidos
 */

'use client'

import { useEffect, useState } from 'react'

import { Activity, AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { logError } from '@/lib/logger'
import { useRouter, usePathname } from '@/lib/next-navigation'
import { getUnresolvedAlerts, resolveAlert, type OperationalAlert } from '@/lib/operational-alerts'
import { supabase } from '@/lib/supabase'
import { notifySuccess, notifyError } from '@/lib/toast'

export function OperationalAlertsNotification() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const getAlertsUrl = () => {
    if (pathname?.startsWith('/transportadora')) return '/transportadora/alertas'
    if (pathname?.startsWith('/empresa')) return '/empresa/alertas'
    if (pathname?.startsWith('/operador')) return '/operador/alertas'
    return '/admin/alertas'
  }

  const alertsUrl = getAlertsUrl()

  useEffect(() => {
    loadAlerts()

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadAlerts, 30000)

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('operational_alerts_notifications')
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
      const unresolved = await getUnresolvedAlerts()
      // Priorizar alertas críticos e limitar a 10
      const sorted = unresolved
        .sort((a, b) => {
          const severityOrder: Record<OperationalAlert['severity'], number> = {
            critical: 0,
            error: 1,
            warning: 2,
            info: 3,
          }
          const aSeverity = a.severity as OperationalAlert['severity']
          const bSeverity = b.severity as OperationalAlert['severity']
          return severityOrder[aSeverity] - severityOrder[bSeverity]
        })
        .slice(0, 10)
      setAlerts(sorted)
    } catch (error) {
      logError('Erro ao carregar alertas', { error }, 'OperationalAlertsNotification')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        notifyError('Usuário não autenticado', undefined, { i18n: { ns: 'common', key: 'errors.authRequired' } })
        return
      }
      await resolveAlert(alertId, `Resolvido por ${session.user.email}`)
      await loadAlerts()
      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertResolved' } })
    } catch (error: unknown) {
      logError('Erro ao resolver alerta', { error }, 'OperationalAlertsNotification')
      notifyError('Erro ao resolver alerta', undefined, { i18n: { ns: 'common', key: 'errors.resolveAlert' } })
    }
  }

  const getSeverityIcon = (severity: OperationalAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-error" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'info':
        return <Info className="h-4 w-4 text-info" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: OperationalAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-light text-error border-error-light'
      case 'error':
        return 'bg-error-light text-error border-error-light'
      case 'warning':
        return 'bg-warning-light text-warning border-warning-light'
      case 'info':
        return 'bg-info-light text-info border-info-light'
      default:
        return 'bg-bg-soft text-ink-strong border-bg-soft'
    }
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const totalCount = alerts.length

  if (loading && totalCount === 0) {
    return null
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9 hover:bg-bg-hover">
          <Activity className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge
              variant={criticalCount > 0 ? 'destructive' : 'secondary'}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalCount > 9 ? '9+' : totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Alertas Operacionais</h3>
          <p className="text-xs text-ink-muted">
            {totalCount} alerta{totalCount !== 1 ? 's' : ''} não resolvido{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-sm text-ink-muted">
              Nenhum alerta pendente
            </div>
          ) : (
            alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className="flex flex-col items-start gap-2 p-3 cursor-pointer"
                onClick={() => {
                  router.push(alertsUrl)
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{alert.title || alert.message}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-2">
                      {alert.message || alert.title}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResolve(alert.id)
                    }}
                  >
                    Resolver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(alertsUrl)
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(alertsUrl)}
              >
                Ver Todos os Alertas
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
